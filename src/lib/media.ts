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
export async function cropImageToAspectRatio(
  file: File,
  aspectRatio: AspectRatio,
): Promise<File> {
  if (!CROPPABLE_TYPES.includes(file.type)) return file;

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
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
      bitmap,
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
