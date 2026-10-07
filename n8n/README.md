# Instagram feed ratio fix

Import [instagram-feed-ratio-fix.json](./instagram-feed-ratio-fix.json) into n8n.
This is a reusable **sub-workflow**, not a webhook or a publishing workflow.
It uses built-in Code and Edit Image nodes; no credentials, external image
service, community package, or Execute Command node is required.

## Connect it

1. In n8n, choose **Import from File**, select the JSON, and save the workflow.
2. In your existing publishing workflow, add **Execute Sub-workflow** on the
   Instagram feed-image branch, before uploading media to public storage.
3. Select **Storiq - Fix Instagram Feed Image Ratios**, pass all input data, run
   once with all items, and enable **Wait for Sub-Workflow Completion**. The
   trigger accepts all data.
4. Pass the complete Storiq Webhook item: `json.body.metadata` is the multipart
   metadata JSON string, and `binary.fileContent_0`, `binary.fileContent_1`, etc.
   contain the corresponding files. n8n may append a file-array index (`0`),
   producing `fileContent_00`, `fileContent_10`, etc.; both naming conventions
   are supported, but ambiguous mappings fail. Leave the Webhook's custom
   **Binary Property** option unset so it does not rename the fields.
   A parsed object or string at `json.metadata` is also accepted.
   Do not strip binary data or change its field names.
5. Upload **each returned item's `binary.data`** to your existing public media
   storage. Use the newly uploaded JPEG URL, not the original URL, as the
   Instagram API's `image_url`. The URL must be retrievable by Meta without
   authentication and remain available throughout publishing.
6. Keep your existing scheduling, carousel assembly, container creation,
   readiness checks, and publishing nodes. Each output retains the original
   `index`, caption, hashtags, and `scheduledFor`. A carousel must assemble the
   returned items in index order; this workflow does not create a carousel.

Do not point `VITE_N8N_WEBHOOK_URL` at this sub-workflow. Keep your parent
webhook and its response handling. Do not report publication success merely
because cropping completed. Propagate workflow errors through the parent's
existing error/response handling and do not enable Continue On Fail here.
The sub-workflow neither waits for scheduled dates nor publishes anything.

## Output

### Connecting the supplied Postiz flow

For the flow with **split content**, **Upload content to postiz**, **Build post**,
and **Switch1**, use the following wiring instead of the generic instructions:

```text
Webhook -> HTTP Request -> Get Channels in Postiz -> split content -> IF
  IF true  -> Execute Sub-workflow -> Upload content to postiz
  IF false -----------------------> Upload content to postiz
Upload content to postiz -> Build post -> Switch1 -> existing posting nodes
```

1. Replace **split content** code with
   [postiz-split-content.js](./postiz-split-content.js). Set the Code node to
   **Run Once for All Items**. Keep its name exactly `split content`.
2. Insert an **IF** node with Boolean condition
   `{{ $json.needsInstagramRatioFix }}` **is true**.
3. On the true output, add **Execute Sub-workflow**, selecting the imported
   ratio-fix workflow. Pass all fields (including binary), set mode to
   **Run once for each item**, and enable **Wait for Sub-Workflow Completion**.
   This setting differs from the generic whole-webhook example: each item
   already wraps exactly one Instagram image in `json.metadata`.
4. Connect the Execute Sub-workflow output and the IF false output directly
   to the existing **Upload content to postiz** node. Keep its binary upload
   property set to `data`. Do not merge by position or connect the IF true
   output directly to upload. The upload/build nodes may run separately for
   each branch; each run processes only its own items.
5. Replace **Build post** code with
   [postiz-build-post.js](./postiz-build-post.js), also in **Run Once for All
   Items** mode. Keep the channel node name `Get Channels in Postiz`.
   Upload must preserve n8n item links, as ordinary per-item nodes do.
   A custom upload node that discards those links must be fixed before use;
   missing/ambiguous links must not be replaced with positional lookups.
6. Keep Switch1 rules based on `$json.platform`. Connect `instagram` to the
   Instagram posting node, `x` to X, and `facebook` to Facebook. In the supplied
   screenshot only the Instagram output is visibly connected; connect the
   other two if those accounts should publish too.

For one image selected for all three platforms, **split content** now returns
two items: an Instagram copy to crop, and an original copy shared by X and
Facebook. There are two uploads. **Build post** produces three posts across
its branch runs: Instagram references the cropped upload ID/path; X and
Facebook reference the original upload ID/path. Multiple source images and
reordered uploads are matched through item links, not array indexes.

The supplied split script dropped `aspectRatio`; the replacement preserves
it. The supplied Build post script used `uploads[index]` and iterated the
whole webhook on every run; that would mismatch files after branching.
The replacement processes only each upload's linked split item. Missing
selected accounts now fail explicitly instead of being silently skipped.
This integration supports the three pictured platforms; unsupported
platforms fail explicitly. Existing X truncation and schedule values remain
unchanged. It does not add carousel grouping or video handling.

Test the two branches together, Instagram-only, X/Facebook-only, and a
multi-image batch in your own n8n instance before enabling posting.

| Selected ratio | Output JPEG | Ratio |
| --- | --- | --- |
| `portrait` | 1080 x 1350 | 4:5 |
| `square` | 1080 x 1080 | 1:1 |
| `landscape` | 1080 x 566 | Approximately 1.91:1, below the upper boundary |

The image is resized to **cover** the target, preserving proportions, then
center-cropped. Small images are upscaled; content near the edges can be lost.
Edit Image auto-orients images before processing. JPEG encoding uses quality
90. Transparent images lose alpha when converted to JPEG; prepare a suitable
background before uploading if its appearance matters.

Each output has flat JSON metadata and one binary field, `data`:

```json
{
  "index": 0,
  "fileName": "photo-instagram-feed.jpg",
  "originalFileName": "photo.png",
  "fileType": "image/jpeg",
  "fileSizeBytes": 123456,
  "platformTypes": ["instagram"],
  "sourcePlatformTypes": ["instagram", "facebook"],
  "aspectRatio": "portrait",
  "width": 1080,
  "height": 1350,
  "processedFor": "instagram_feed",
  "fileContent": { "transferType": "n8n_binary", "fieldName": "data" }
}
```

`fileSizeBytes` above is illustrative. The actual buffer size is measured.
The original caption, hashtags, visualStyle, scheduledFor, and request context
are retained. `visualStyle` is metadata only; this workflow does not apply it.
Other platforms must use a separate branch with their original files.
Items not targeting Instagram are excluded; an all-excluded batch is an error.

## Scope and requirements

- Only JPEG, PNG, and WebP **feed images** are accepted. `story`, videos, HEIC,
  GIF, and other formats fail explicitly. Route them separately.
- Selected ratios must be portrait, square, or landscape; there is no silent
  Story-to-feed conversion or fallback to the original invalid image.
- The output must be a JPEG with the exact target dimensions, a width/height
  ratio between 0.8 and 1.91, and a binary size no greater than the workflow's
  conservative 8 MiB limit. Oversized outputs fail rather than publish.
- Your n8n installation must support Code nodes and Edit Image. For non-Docker
  self-hosted installations, install GraphicsMagick on the **n8n host**, not
  just on this app's computer. Confirm format support on your installation.
- The app already attempts browser-side cropping. This adds a server-side
  normalization/validation step. If browser cropping fails, the app logs the
  failure and sends the original to n8n without an Accept/Reject popup;
  it cannot recover content already removed by a browser crop.

## Verify before enabling publishing

Run `node --test n8n\instagram-feed-ratio-fix.test.mjs` from this repository.
These tests validate the exported workflow's wiring, embedded Code nodes,
metadata preservation, crop geometry, and failure cases. They do not execute
n8n or GraphicsMagick.

For the Postiz integration, also run
`node --test n8n\postiz-integration.test.mjs`. This tests the replacement Code
scripts, their ratio-workflow input compatibility, branch-specific upload
mapping, and metadata preservation using mocked n8n item links. Live
sub-workflow and Postiz node item-link behavior still needs verification in
your n8n instance.

In your n8n instance, run the parent workflow with a tall image, a wide image,
a square image, and a multi-file batch with distinct captions/schedules.
Check the returned binaries visually and verify the dimensions in the final
node. Test a phone image with EXIF rotation and a transparent PNG. Confirm a
Story image, video, missing file, and malformed metadata stop the execution.
Then test storage upload and Instagram publication with a test account before
using the production publishing branch.

References:
- [n8n Edit Image](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.editimage/)
- [n8n Execute Sub-workflow Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.executeworkflowtrigger/)
