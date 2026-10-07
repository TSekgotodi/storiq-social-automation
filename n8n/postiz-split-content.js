const req = $("Webhook").first();
const body = req.json.body ?? req.json;
const raw = body.metadata;
if (!raw) throw new Error('No "metadata" field found in Webhook.');
const meta = typeof raw === "string" ? JSON.parse(raw) : raw;
if (
  meta.schemaVersion !== "1.0" ||
  !Array.isArray(meta.content) ||
  !meta.content.length ||
  meta.contentCount !== meta.content.length
) {
  throw new Error("Expected Storiq 1.0 metadata with a matching contentCount.");
}

const output = [];
for (const [index, item] of meta.content.entries()) {
  if (!Array.isArray(item.platformTypes) || !item.platformTypes.length) {
    throw new Error(`${item.fileName}: no publishing platforms selected.`);
  }
  const platforms = [...new Set(item.platformTypes)];
  if (platforms.some((platform) => !["instagram", "x", "facebook"].includes(platform))) {
    throw new Error(`${item.fileName}: this Postiz flow supports Instagram, X, and Facebook only.`);
  }
  const key = item.fileContent?.fieldName;
  if (item.fileContent?.transferType !== "multipart_binary" || typeof key !== "string" || !key) {
    throw new Error(`${item.fileName}: invalid multipart file metadata.`);
  }
  const keys = [key, `${key}0`].filter((candidate) =>
    Object.hasOwn(req.binary ?? {}, candidate),
  );
  if (keys.length !== 1) {
    throw new Error(
      `${item.fileName}: missing or ambiguous binary "${key}". Binary keys: ` +
      Object.keys(req.binary ?? {}).join(", "),
    );
  }
  const file = req.binary[keys[0]];
  if (file.mimeType !== item.fileType) {
    throw new Error(`${item.fileName}: file MIME type does not match metadata.`);
  }
  const needsInstagramRatioFix = platforms.includes("instagram");
  if (needsInstagramRatioFix) {
    if (!["portrait", "square", "landscape"].includes(item.aspectRatio)) {
      throw new Error(`${item.fileName}: route Stories separately; select a feed ratio.`);
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(item.fileType)) {
      throw new Error(`${item.fileName}: route videos/other formats separately; Instagram ratio fixing supports JPEG, PNG, and WebP.`);
    }
  }

  const variants = [];
  if (needsInstagramRatioFix) variants.push(["instagram"]);
  const otherPlatforms = platforms.filter((platform) => platform !== "instagram");
  if (otherPlatforms.length) variants.push(otherPlatforms);

  for (const variantPlatforms of variants) {
    const fix = variantPlatforms.includes("instagram");
    const content = {
      ...item,
      index,
      platformTypes: variantPlatforms,
      fileContent: { transferType: "multipart_binary", fieldName: "data" },
    };
    output.push({
      json: {
        index,
        requestId: meta.requestId,
        caption: item.caption,
        hashtags: item.hashtags,
        text: [item.caption, item.hashtags].filter(Boolean).join("\n\n"),
        scheduledFor: item.scheduledFor,
        platforms: variantPlatforms,
        aspectRatio: item.aspectRatio,
        originalFileName: item.fileName,
        fileName: fix
          ? `${(item.fileName || "image").replace(/\.[^.]+$/, "")}-instagram-feed.jpg`
          : item.fileName,
        needsInstagramRatioFix: fix,
        metadata: {
          ...meta,
          contentCount: 1,
          platformTypes: variantPlatforms,
          content: [content],
        },
      },
      binary: { data: file },
      // The webhook is read directly, not from this Code node's input.
      pairedItem: { item: 0 },
    });
  }
}
return output;
