export type PlatformType = "instagram" | "facebook" | "tiktok" | "x";

export interface N8nContentItem {
  index: number;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  platformTypes: PlatformType[];
  fileContent: {
    transferType: "multipart_binary";
    fieldName: string;
  };
  caption: string;
  hashtags: string;
  visualStyle: "editorial" | "clean" | "warm" | "monochrome";
  aspectRatio: "portrait" | "square" | "landscape" | "story";
  scheduledFor: string | null;
}

export interface N8nWorkflowPayload {
  schemaVersion: "1.0";
  eventType: "content.schedule" | "content.publish_now";
  requestId: string;
  createdAt: string;
  source: "storiq-web";
  timezone: string;
  publishMode: "smart" | "now";
  status: "scheduled" | "publish_now";
  contentType: "image" | "video" | "mixed";
  platformTypes: PlatformType[];
  contentCount: number;
  content: N8nContentItem[];
}

interface TriggerWorkflowOptions {
  webhookUrl: string | undefined;
  payload: N8nWorkflowPayload;
  files: File[];
}

interface N8nWorkflowResponse {
  success: true;
  requestId: string;
  executionId?: string;
  data?: unknown;
}

export class N8nConnectionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "N8nConnectionError";
  }
}

export class N8nWebhookResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "N8nWebhookResponseError";
  }
}

const MAX_FILE_SIZE_BYTES = 250 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 60_000;

function validateWebhookUrl(webhookUrl: string | undefined) {
  if (!webhookUrl) {
    throw new N8nConnectionError(
      "Storiq disconnected. Add VITE_N8N_WEBHOOK_URL to your environment.",
    );
  }

  let url: URL;
  try {
    url = new URL(webhookUrl);
  } catch {
    throw new N8nConnectionError(
      "Storiq disconnected. The configured n8n webhook URL is invalid.",
    );
  }

  const isLocalhost = ["localhost", "127.0.0.1"].includes(url.hostname);
  if (url.protocol !== "https:" && !isLocalhost) {
    throw new N8nConnectionError(
      "Storiq disconnected. The n8n webhook must use HTTPS in production.",
    );
  }

  return url.toString();
}

function validateFiles(files: File[], payload: N8nWorkflowPayload) {
  if (!files.length) {
    throw new Error("Upload at least one image or video before publishing.");
  }

  if (files.length !== payload.content.length) {
    throw new Error("The content queue does not match the publishing metadata.");
  }

  files.forEach((file, index) => {
    if (file.size === 0) {
      throw new Error(`${file.name} is empty and cannot be uploaded.`);
    }
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      throw new Error(`${file.name} is not a supported image or video.`);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error(`${file.name} is larger than the 250 MB upload limit.`);
    }
    if (payload.content[index]?.fileType !== file.type) {
      throw new Error(`The file metadata for ${file.name} is out of sync.`);
    }
  });
}

function validatePayload(payload: N8nWorkflowPayload) {
  if (!payload.platformTypes.length) {
    throw new Error("Select at least one publishing platform.");
  }

  if (payload.contentCount !== payload.content.length) {
    throw new Error("The declared content count does not match the content queue.");
  }

  if (payload.eventType === "content.schedule") {
    payload.content.forEach((item) => {
      if (!item.scheduledFor) {
        throw new Error(`${item.fileName} does not have a publishing date and time.`);
      }

      const publishTime = new Date(item.scheduledFor).getTime();
      if (!Number.isFinite(publishTime) || publishTime <= Date.now()) {
        throw new Error(`${item.fileName} must be scheduled for a future time.`);
      }
    });
  }
}

export async function triggerN8nWorkflow({
  webhookUrl,
  payload,
  files,
}: TriggerWorkflowOptions): Promise<N8nWorkflowResponse> {
  const validatedUrl = validateWebhookUrl(webhookUrl);
  validatePayload(payload);
  validateFiles(files, payload);

  const formData = new FormData();
  formData.append("metadata", JSON.stringify(payload));
  formData.append("schemaVersion", payload.schemaVersion);
  formData.append("eventType", payload.eventType);
  formData.append("requestId", payload.requestId);

  files.forEach((file, index) => {
    const item = payload.content[index];
    formData.append(item.fileContent.fieldName, file, file.name);
    formData.append(`contentMetadata_${index}`, JSON.stringify(item));
  });

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(validatedUrl, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    const responseText = await response.text();
    let responseData: unknown;

    if (responseText) {
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }
    }

    if (!response.ok) {
      const detail =
        typeof responseData === "object" &&
        responseData !== null &&
        "message" in responseData
          ? String(responseData.message)
          : `n8n returned HTTP ${response.status}.`;
      throw new N8nWebhookResponseError(detail);
    }

    const executionId =
      typeof responseData === "object" &&
      responseData !== null &&
      "executionId" in responseData
        ? String(responseData.executionId)
        : undefined;

    return {
      success: true,
      requestId: payload.requestId,
      executionId,
      data: responseData,
    };
  } catch (error) {
    if (
      error instanceof N8nConnectionError ||
      error instanceof N8nWebhookResponseError
    ) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new N8nConnectionError(
        "Storiq disconnected. The n8n workflow timed out after 60 seconds.",
        { cause: error },
      );
    }
    throw new N8nConnectionError(
      "Storiq disconnected. Could not reach the n8n webhook.",
      { cause: error },
    );
  } finally {
    window.clearTimeout(timeout);
  }
}
