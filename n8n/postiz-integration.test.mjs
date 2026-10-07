import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const splitCode = readFileSync(new URL("./postiz-split-content.js", import.meta.url), "utf8");
const buildCode = readFileSync(new URL("./postiz-build-post.js", import.meta.url), "utf8");
const workflow = JSON.parse(readFileSync(new URL("./instagram-feed-ratio-fix.json", import.meta.url), "utf8"));
const prepareCode = workflow.nodes.find((node) => node.name === "Prepare Instagram Images").parameters.jsCode;
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const accounts = ["instagram-standalone", "x", "facebook"].map((identifier) => ({
  json: { id: `account-${identifier}`, identifier, disabled: false },
}));

function webhook(platforms = ["instagram", "x", "facebook"], count = 1) {
  const content = Array.from({ length: count }, (_, index) => ({
    index, caption: `Caption ${index}`, hashtags: "#test",
    scheduledFor: `2027-01-0${index + 1}T12:00:00.000Z`,
    platformTypes: platforms,
    fileName: `photo-${index}.png`, fileType: "image/png",
    aspectRatio: index % 2 ? "square" : "portrait",
    fileContent: { transferType: "multipart_binary", fieldName: `fileContent_${index}` },
  }));
  return {
    json: { body: { metadata: JSON.stringify({
      schemaVersion: "1.0", contentCount: count, content,
      requestId: "request-1", eventType: "content.schedule",
      timezone: "Africa/Johannesburg", publishMode: "smart",
    }) } },
    binary: Object.fromEntries(content.map((item) => [
      `${item.fileContent.fieldName}0`,
      { mimeType: "image/png", data: `binary-${item.index}`, fileName: item.fileName },
    ])),
  };
}

function split(req) {
  return new AsyncFunction("$", splitCode)((name) => {
    assert.equal(name, "Webhook");
    return { first: () => req };
  });
}

function build(uploads, sources, channels = accounts) {
  return new AsyncFunction("$", "$input", buildCode)((name) => {
    if (name === "Get Channels in Postiz") return { all: () => channels };
    assert.equal(name, "split content");
    return { itemMatching: (index) => sources[index] };
  }, { all: () => uploads });
}

test("mixed-platform split preserves ratios and wraps compatible Instagram input", async () => {
  const req = webhook();
  const output = await split(req);
  assert.equal(output.length, 2);
  assert.deepEqual(output.map((item) => item.json.platforms), [["instagram"], ["x", "facebook"]]);
  assert.deepEqual(output.map((item) => item.json.needsInstagramRatioFix), [true, false]);
  assert.equal(output[0].json.aspectRatio, "portrait");
  assert.equal(output[0].json.fileName, "photo-0-instagram-feed.jpg");
  assert.equal(output[1].json.fileName, "photo-0.png");
  assert.equal(output[1].binary.data, req.binary.fileContent_00);
  const prepared = await new AsyncFunction("$input", prepareCode)({ all: () => [output[0]] });
  assert.equal(prepared.length, 1);
  assert.equal(prepared[0].json.targetHeight, 1350);
  assert.equal(prepared[0].binary.data, req.binary.fileContent_00);
});

test("single-platform and other-platform batches produce only the needed variants", async () => {
  assert.equal((await split(webhook(["instagram"])))[0].json.needsInstagramRatioFix, true);
  const others = await split(webhook(["x", "facebook"]));
  assert.equal(others.length, 1);
  assert.equal(others[0].json.needsInstagramRatioFix, false);
  const duplicate = await split(webhook(["instagram", "instagram", "x", "x"]));
  assert.deepEqual(duplicate.map((item) => item.json.platforms), [["instagram"], ["x"]]);
});

test("separate branch runs use cropped Instagram uploads and original X/Facebook uploads", async () => {
  const sources = await split(webhook());
  const instagram = await build([{ json: { id: "cropped-id", path: "https://example.test/cropped.jpg" } }], [sources[0]]);
  const others = await build([{ json: { id: "original-id", path: "https://example.test/original.png" } }], [sources[1]]);
  const combined = [...instagram, ...others];
  assert.deepEqual(combined.map((item) => [item.json.platform, item.json.imageId]), [
    ["instagram", "cropped-id"], ["x", "original-id"], ["facebook", "original-id"],
  ]);
  assert.equal(instagram[0].json.fileName, "photo-0-instagram-feed.jpg");
  assert.equal(others[0].json.fileName, "photo-0.png");
  for (const item of combined) {
    assert.equal(item.json.content, "Caption 0\n\n#test");
    assert.equal(item.json.date, "2027-01-01T12:00:00.000Z");
    assert.deepEqual(item.pairedItem, { item: 0 });
  }
});

test("reordered multi-file uploads follow source item links rather than positions", async () => {
  const sources = await split(webhook(["instagram", "facebook"], 2));
  const linked = [sources[2], sources[0]];
  const output = await build([
    { json: { id: "crop-1", path: "https://example.test/1.jpg" } },
    { json: { id: "crop-0", path: "https://example.test/0.jpg" } },
  ], linked);
  assert.equal(output[0].json.content, "Caption 1\n\n#test");
  assert.equal(output[0].json.date, "2027-01-02T12:00:00.000Z");
  assert.equal(output[0].json.imageId, "crop-1");
  assert.equal(output[1].json.content, "Caption 0\n\n#test");
  assert.deepEqual(output[1].pairedItem, { item: 1 });
});

test("X truncation and preferred Instagram account selection remain unchanged", async () => {
  const sources = await split(webhook());
  sources[1].json.caption = "a".repeat(300);
  const output = await build([{ json: { id: "original", path: "https://example.test/a.png" } }], [sources[1]]);
  assert.equal(output[0].json.content.length, 280);
  assert.ok(output[1].json.content.length > 280);
  const instagram = await build([{ json: { id: "crop", path: "https://example.test/a.jpg" } }], [sources[0]], [
    { json: { identifier: "instagram", id: "legacy", disabled: false } }, ...accounts,
  ]);
  assert.equal(instagram[0].json.integrationId, "account-instagram-standalone");
});

test("bad binary, unsupported platforms, Stories and videos fail explicitly", async () => {
  const missing = webhook();
  missing.binary = {};
  await assert.rejects(split(missing), /missing or ambiguous/);
  await assert.rejects(split(webhook(["tiktok"])), /supports Instagram, X, and Facebook/);
  for (const change of [{ aspectRatio: "story" }, { fileType: "video/mp4" }]) {
    const req = webhook();
    const meta = JSON.parse(req.json.body.metadata);
    Object.assign(meta.content[0], change);
    req.binary.fileContent_00.mimeType = meta.content[0].fileType;
    req.json.body.metadata = JSON.stringify(meta);
    await assert.rejects(split(req), /route/i);
  }
});

test("missing upload/account/link stops Build post rather than silently skipping", async () => {
  const sources = await split(webhook());
  await assert.rejects(build([{ json: {} }], [sources[0]]), /No uploaded media/);
  const upload = [{ json: { id: "id", path: "https://example.test/a.jpg" } }];
  await assert.rejects(build(upload, [sources[0]], []), /No enabled Postiz account/);
  await assert.rejects(build(upload, []), TypeError);
});
