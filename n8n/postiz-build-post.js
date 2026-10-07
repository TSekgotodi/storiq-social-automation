const accounts = $("Get Channels in Postiz").all().map((item) => item.json);
const ACCOUNT_TYPES = {
  instagram: ["instagram-standalone", "instagram"],
  facebook: ["facebook"],
  x: ["x"],
};
const findAccount = (platform) =>
  (ACCOUNT_TYPES[platform] ?? [])
    .map((type) => accounts.find((account) => account.identifier === type && !account.disabled))
    .find(Boolean);

const output = [];
for (const [inputIndex, input] of $input.all().entries()) {
  const upload = input.json;
  // Follow n8n item links, not upload array positions or the whole webhook batch.
  const source = $("split content").itemMatching(inputIndex).json;
  if (!upload?.id || !upload?.path) {
    throw new Error(`No uploaded media found for ${source.fileName}.`);
  }
  if (!Array.isArray(source.platforms) || !source.platforms.length) {
    throw new Error(`${source.fileName}: missing linked platform metadata.`);
  }
  const text = [source.caption, source.hashtags].filter(Boolean).join("\n\n");
  for (const platform of source.platforms) {
    const account = findAccount(platform);
    if (!account?.id) {
      throw new Error(`No enabled Postiz account found for ${platform}. Connect the account or deselect that platform.`);
    }
    output.push({
      json: {
        platform,
        integrationId: account.id,
        settingsType: account.identifier,
        date: source.scheduledFor,
        content: platform === "x" ? text.slice(0, 280) : text,
        imageId: upload.id,
        imagePath: upload.path,
        fileName: source.fileName,
      },
      pairedItem: { item: inputIndex },
    });
  }
}
return output;
