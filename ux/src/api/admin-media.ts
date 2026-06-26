import { apiFetch } from "./client.js";

export type MediaAsset = {
  id: string;
  name: string;
  tags: string[];
  mimeType: string;
  url: string;
  uploadedBy?: string | null;
  createdAt: string;
};

export type MediaUploadInput = {
  name: string;
  tags?: string[];
  mimeType: string;
  dataBase64: string;
};

export function fetchMediaAssets(token: string, opts?: { q?: string; tag?: string }) {
  const params = new URLSearchParams();
  if (opts?.q?.trim()) params.set("q", opts.q.trim());
  if (opts?.tag?.trim()) params.set("tag", opts.tag.trim());
  const query = params.toString();
  return apiFetch<MediaAsset[]>(query ? `/api/media?${query}` : "/api/media", { token });
}

export function uploadMediaAsset(token: string, data: MediaUploadInput) {
  return apiFetch<MediaAsset>("/api/media", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export function updateMediaAsset(
  token: string,
  id: string,
  data: { name?: string; tags?: string[] },
) {
  return apiFetch<MediaAsset>(`/api/media/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export function deleteMediaAsset(token: string, id: string) {
  return apiFetch<void>(`/api/media/${id}`, { method: "DELETE", token });
}

export async function fileToMediaUpload(
  file: File,
  name?: string,
  tags?: string[],
): Promise<MediaUploadInput> {
  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("No se pudo leer el archivo"));
        return;
      }
      resolve(result.split(",")[1] ?? result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("Error al leer archivo"));
    reader.readAsDataURL(file);
  });
  return {
    name: name?.trim() || file.name.replace(/\.[^.]+$/, ""),
    tags,
    mimeType: file.type,
    dataBase64,
  };
}
