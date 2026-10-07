export type AspectRatio = "portrait" | "square" | "landscape" | "story";

const ASPECT_RATIOS: Record<AspectRatio, number> = {
  portrait: 4 / 5,
  square: 1,
  landscape: 1.91,
  story: 9 / 16,
};

const CROPPABLE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_OUTPUT_EDGE = 2160;
const RATIO_TOLERANCE = 0.01;

/**
 * Center-crops an image to the selected ratio so social platforms such as
 * Instagram receive dimensions they accept. Videos and animated formats are
 * returned unchanged.
 */
type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

async function decodeImage(file: File): Promise<DecodedImage | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  } catch {
    // Some browsers reject createImageBitmap for files they can still display.
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    if (!image.naturalWidth || !image.naturalHeight) {
      URL.revokeObjectURL(url);
      return null;
    }
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      close: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
    return null;
  }
}

export async function cropImageToAspectRatio(
  file: File,
  aspectRatio: AspectRatio,
): Promise<File> {
  if (!CROPPABLE_TYPES.includes(file.type)) return file;

  const bitmap = await decodeImage(file);
  if (!bitmap) {
    throw new Error(`Could not decode ${file.name} for cropping.`);
  }

  try {
    const targetRatio = ASPECT_RATIOS[aspectRatio];
    const sourceRatio = bitmap.width / bitmap.height;

    if (Math.abs(sourceRatio - targetRatio) / targetRatio <= RATIO_TOLERANCE) {
      return file;
    }

    let cropWidth = bitmap.width;
    let cropHeight = bitmap.height;
    if (sourceRatio > targetRatio) {
      cropWidth = Math.round(bitmap.height * targetRatio);
    } else {
      cropHeight = Math.round(bitmap.width / targetRatio);
    }

    const cropX = Math.round((bitmap.width - cropWidth) / 2);
    const cropY = Math.round((bitmap.height - cropHeight) / 2);
    const scale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(cropWidth, cropHeight));
    const outputWidth = Math.round(cropWidth * scale);
    const outputHeight = Math.round(cropHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error(`Could not prepare ${file.name} for publishing.`);

    // JPEG has no transparency, so transparent PNG/WebP pixels become white.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, outputWidth, outputHeight);
    context.imageSmoothingQuality = "high";
    context.drawImage(
      bitmap.source,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight,
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) throw new Error(`Could not crop ${file.name} for publishing.`);

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}
