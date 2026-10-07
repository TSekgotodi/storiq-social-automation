import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workflow = JSON.parse(
  readFileSync(new URL("./instagram-feed-ratio-fix.json", import.meta.url), "utf8"),
);
const nodes = new Map(workflow.nodes.map((node) => [node.name, node]));
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);

function content(index = 0, aspectRatio = "portrait") {
  return {
    index,
    fileName: `photo-${index}.png`,
    fileType: "image/png",
    fileSizeBytes: 100,
    platformTypes: ["instagram", "facebook"],
    fileContent: { transferType: "multipart_binary", fieldName: `fileContent_${index}` },
    caption: `Caption ${index}`,
    hashtags: "#test",
    visualStyle: "clean",
    aspectRatio,
    scheduledFor: `2027-01-0${index + 1}T12:00:00.000Z`,
  };
}

function webhook(contents = [content()]) {
  return {
    json: {
      body: {
        metadata: JSON.stringify({
          schemaVersion: "1.0",
          requestId: "request-123",
          eventType: "content.schedule",
          publishMode: "smart",
          timezone: "Africa/Johannesburg",
          contentCount: contents.length,
          content: contents,
        }),
      },
    },
    binary: Object.fromEntries(
      contents.map((item) => [
        item.fileContent.fieldName,
        { data: "filesystem-reference", mimeType: item.fileType, fileName: item.fileName },
      ]),
    ),
  };
}

function runCode(name, items, linked = {}, buffers = []) {
  const fn = new AsyncFunction("$input", "$", nodes.get(name).parameters.jsCode);
  return fn.call(
    { helpers: { getBinaryDataBuffer: async (index, key) => {
      assert.equal(key, "data");
      return buffers[index] ?? jpeg;
    } } },
    { all: () => items },
    (nodeName) => ({ itemMatching: (index) => {
      assert.ok(linked[nodeName]?.[index], `Missing linked item: ${nodeName}[${index}]`);
      return linked[nodeName][index];
    } }),
  );
}

function expression(value, json) {
  return typeof value === "string" && value.startsWith("={{")
    ? new Function("$json", `return (${value.slice(3, -2)});`)(json)
    : value;
}

test("export contains one connected, fail-closed path of built-in nodes", () => {
  assert.equal(workflow.active, false);
  assert.equal(nodes.size, workflow.nodes.length);
  assert.equal(nodes.get("When Executed by Another Workflow").parameters.inputSource, "passthrough");
  let name = "When Executed by Another Workflow";
  const seen = new Set();
  while (name) {
    assert.ok(nodes.has(name));
    assert.ok(!seen.has(name));
    seen.add(name);
    const node = nodes.get(name);
    assert.ok([
      "n8n-nodes-base.executeWorkflowTrigger",
      "n8n-nodes-base.code",
      "n8n-nodes-base.editImage",
    ].includes(node.type));
    assert.ok(!node.continueOnFail);
    name = workflow.connections[name]?.main[0][0].node;
  }
  assert.equal(seen.size, nodes.size);
  assert.equal(nodes.get("Resize to Cover").parameters.resizeOption, "minimumArea");
  assert.equal(nodes.get("Crop Instagram Feed").parameters.options.format, "jpeg");
});

test("preparation splits batches, retains item links and binary references", async () => {
  const first = webhook([content(0), content(1, "square"), content(2, "landscape")]);
  const second = webhook([content(0, "square")]);
  const prepared = await runCode("Prepare Instagram Images", [first, second]);
  assert.equal(prepared.length, 4);
  assert.deepEqual(prepared.map((item) => [item.json.targetWidth, item.json.targetHeight]), [
    [1080, 1350], [1080, 1080], [1080, 566], [1080, 1080],
  ]);
  assert.equal(prepared[1].binary.data, first.binary.fileContent_1);
  assert.equal(prepared[3].pairedItem.item, 1);
  assert.equal(prepared[2].json.content.caption, "Caption 2");
});

test("accepts parsed metadata and excludes other platforms", async () => {
  const other = { ...content(1), platformTypes: ["facebook"] };
  const input = webhook([content(), other]);
  input.json = { metadata: JSON.parse(input.json.body.metadata) };
  assert.equal((await runCode("Prepare Instagram Images", [input])).length, 1);
  await assert.rejects(runCode("Prepare Instagram Images", [webhook([other])]), /No Instagram/);
});

test("handles n8n multipart file-array suffixes and rejects ambiguous mappings", async () => {
  const input = webhook([content(0), content(1, "square")]);
  input.binary = Object.fromEntries(
    Object.entries(input.binary).map(([key, binary]) => [`${key}0`, binary]),
  );
  const prepared = await runCode("Prepare Instagram Images", [input]);
  assert.equal(prepared[0].binary.data, input.binary.fileContent_00);
  assert.equal(prepared[1].binary.data, input.binary.fileContent_10);
  input.binary.fileContent_0 = input.binary.fileContent_00;
  await assert.rejects(runCode("Prepare Instagram Images", [input]), /ambiguous file mapping/);
});

test("invalid metadata and missing or mismatched binaries stop processing", async () => {
  const badCount = webhook();
  const payload = JSON.parse(badCount.json.body.metadata);
  payload.contentCount = 2;
  badCount.json.body.metadata = JSON.stringify(payload);
  await assert.rejects(runCode("Prepare Instagram Images", [badCount]), /contentCount/);
  await assert.rejects(runCode("Prepare Instagram Images", [{ json: {}, binary: {} }]), /Expected Storiq/);
  const missing = webhook();
  missing.binary = {};
  await assert.rejects(runCode("Prepare Instagram Images", [missing]), /missing multipart/);
  const wrongMime = webhook();
  wrongMime.binary.fileContent_0.mimeType = "video/mp4";
  await assert.rejects(runCode("Prepare Instagram Images", [wrongMime]), /MIME type/);
  const invalidJson = webhook();
  invalidJson.json.body.metadata = "{";
  await assert.rejects(runCode("Prepare Instagram Images", [invalidJson]), SyntaxError);
});

test("Story, videos, unsupported images and unknown ratios fail explicitly", async () => {
  for (const aspectRatio of ["story", "unknown", "__proto__"]) {
    await assert.rejects(
      runCode("Prepare Instagram Images", [webhook([content(0, aspectRatio)])]),
      /feed images require/,
    );
  }
  for (const fileType of ["video/mp4", "image/heic", "image/gif"]) {
    await assert.rejects(
      runCode("Prepare Instagram Images", [webhook([{ ...content(), fileType }])]),
      /JPEG, PNG, and WebP/,
    );
  }
});

test("crop expressions yield centered exact canvases for tall, wide and small images", async () => {
  const resize = nodes.get("Resize to Cover").parameters;
  const crop = nodes.get("Crop Instagram Feed").parameters;
  for (const ratio of ["portrait", "square", "landscape"]) {
    const prepared = await runCode("Prepare Instagram Images", [webhook([content(0, ratio)])]);
    const source = prepared[0].json;
    const targetWidth = expression(resize.width, source);
    const targetHeight = expression(resize.height, source);
    for (const [width, height] of [[900, 3000], [4000, 600], [2000, 2000], [64, 48]]) {
      const scale = Math.max(targetWidth / width, targetHeight / height);
      const resizedWidth = Math.round(width * scale);
      const resizedHeight = Math.round(height * scale);
      const planned = await runCode("Plan Center Crop", [{
        json: { size: { width: resizedWidth, height: resizedHeight } },
        binary: prepared[0].binary,
      }], { "Resize to Cover": prepared });
      const json = planned[0].json;
      const x = expression(crop.positionX, json);
      const y = expression(crop.positionY, json);
      assert.equal(expression(crop.width, json), targetWidth);
      assert.equal(expression(crop.height, json), targetHeight);
      assert.ok(x >= 0 && x + targetWidth <= resizedWidth);
      assert.ok(y >= 0 && y + targetHeight <= resizedHeight);
      assert.ok(Math.abs(x - (resizedWidth - targetWidth) / 2) <= 0.5);
      assert.ok(Math.abs(y - (resizedHeight - targetHeight) / 2) <= 0.5);
      assert.ok(targetWidth / targetHeight >= 0.8 && targetWidth / targetHeight <= 1.91);
    }
  }
});

test("measurements smaller than the canvas or missing dimensions fail", async () => {
  const prepared = await runCode("Prepare Instagram Images", [webhook()]);
  for (const size of [{ width: 1079, height: 1350 }, { width: 1080, height: 1349 }, {}]) {
    await assert.rejects(
      runCode("Plan Center Crop", [{ json: { size } }], { "Resize to Cover": prepared }),
      /resize did not cover/,
    );
  }
});

test("final validation preserves each caption/schedule and returns only Instagram JPEG binaries", async () => {
  const prepared = await runCode("Prepare Instagram Images", [
    webhook([content(0), content(1, "square"), content(2, "landscape")]),
  ]);
  const items = prepared.map((item) => ({
    json: { size: { width: item.json.targetWidth, height: item.json.targetHeight }, format: "JPEG" },
    binary: item.binary,
  }));
  const output = await runCode("Validate and Return Images", items, { "Crop Instagram Feed": prepared });
  for (const [index, item] of output.entries()) {
    assert.equal(item.json.caption, `Caption ${index}`);
    assert.equal(item.json.scheduledFor, prepared[index].json.content.scheduledFor);
    assert.equal(item.json.index, index);
    assert.equal(item.json.requestId, "request-123");
    assert.deepEqual(item.json.platformTypes, ["instagram"]);
    assert.deepEqual(item.json.sourcePlatformTypes, ["instagram", "facebook"]);
    assert.equal(item.json.fileSizeBytes, jpeg.length);
    assert.deepEqual(item.json.fileContent, { transferType: "n8n_binary", fieldName: "data" });
    assert.deepEqual(Object.keys(item.binary), ["data"]);
    assert.equal(item.binary.data.mimeType, "image/jpeg");
    assert.equal(item.binary.data.fileName, `photo-${index}-instagram-feed.jpg`);
    assert.deepEqual(item.pairedItem, { item: index });
  }
});

test("final validation rejects wrong dimensions, encoding, signatures and size", async () => {
  const prepared = await runCode("Prepare Instagram Images", [webhook()]);
  const linked = { "Crop Instagram Feed": prepared };
  const valid = { json: { size: { width: 1080, height: 1350 }, format: "JPEG" }, binary: prepared[0].binary };
  for (const json of [
    { size: { width: 1080, height: 1920 }, format: "JPEG" },
    { size: { width: 1080, height: 1350 }, format: "PNG" },
    { size: { width: 1081, height: 1350 }, format: "JPEG" },
  ]) {
    await assert.rejects(runCode("Validate and Return Images", [{ ...valid, json }], linked), /validation/);
  }
  await assert.rejects(
    runCode("Validate and Return Images", [valid], linked, [Buffer.from("not a JPEG")]),
    /not a JPEG/,
  );
  const tooLarge = Buffer.alloc(8 * 1024 * 1024 + 1);
  jpeg.copy(tooLarge);
  await assert.rejects(runCode("Validate and Return Images", [valid], linked, [tooLarge]), /8 MiB/);
  const boundary = tooLarge.subarray(0, 8 * 1024 * 1024);
  const output = await runCode("Validate and Return Images", [valid], linked, [boundary]);
  assert.equal(output[0].json.fileSizeBytes, 8 * 1024 * 1024);
});
