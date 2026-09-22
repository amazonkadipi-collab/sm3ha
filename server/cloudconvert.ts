import { createHash } from "node:crypto";

const API = "https://api.cloudconvert.com/v2";

function getApiKey() {
  const value = process.env.CLOUDCONVERT_API_KEY?.trim();
  if (!value) throw new Error("CLOUDCONVERT_API_KEY is not configured");
  return value;
}

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.message || `CloudConvert request failed: ${response.status}`);
  return body.data ?? body;
}

export async function startAuthorizedConversion(sourceUrl: string, format: "mp3" | "mp4", quality: string) {
  if (!/^https:\/\//i.test(sourceUrl)) throw new Error("Only HTTPS media sources are allowed");

  const sourceHash = createHash("sha256").update(sourceUrl).digest("hex").slice(0, 12);
  const output = format === "mp3"
    ? {
        output_format: "mp3",
        audio_codec: "mp3",
        audio_bitrate: `${quality.replace(/[^0-9]/g, "") || "128"}k`,
      }
    : {
        output_format: "mp4",
        video_codec: "x264",
        height: Number(quality.replace(/[^0-9]/g, "")) || 360,
        audio_codec: "aac",
      };

  return request("/jobs", {
    method: "POST",
    body: JSON.stringify({
      tag: `sm3ha-${sourceHash}-${format}`,
      tasks: {
        "import-source": {
          operation: "import/url",
          url: sourceUrl,
          filename: format === "mp3" ? "source.mp3" : "source.mp4",
        },
        "convert-media": {
          operation: "convert",
          input: "import-source",
          ...output,
        },
        "export-result": {
          operation: "export/url",
          input: "convert-media",
        },
      },
    }),
  });
}

export async function getAuthorizedConversion(jobId: string) {
  return request(`/jobs/${encodeURIComponent(jobId)}`);
}

export function getExportUrl(job: any) {
  const task = Array.isArray(job?.tasks)
    ? job.tasks.find((item: any) => item.name === "export-result")
    : undefined;
  return task?.result?.files?.[0]?.url ?? null;
}
