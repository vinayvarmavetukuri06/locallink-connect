import { supabase } from "@/integrations/supabase/client";

const AVATAR_BUCKET = "avatars";

export async function uploadAvatar(file: File, userKey: string): Promise<string | null> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userKey}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) {
    console.error("uploadAvatar failed", error);
    return null;
  }
  return path;
}

export async function signedAvatarUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function signedAvatarUrls(paths: (string | null | undefined)[]): Promise<(string | null)[]> {
  const valid = paths.map((p) => (p && !/^https?:\/\//.test(p) ? p : null));
  const toSign = valid.filter((p): p is string => !!p);
  if (toSign.length === 0) return paths.map((p) => (p && /^https?:\/\//.test(p) ? p : null));
  const { data } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrls(toSign, 60 * 60 * 24 * 365);
  const byPath = new Map<string, string>();
  (data ?? []).forEach((d, i) => {
    if (d?.signedUrl) byPath.set(toSign[i], d.signedUrl);
  });
  return paths.map((p) => {
    if (!p) return null;
    if (/^https?:\/\//.test(p)) return p;
    return byPath.get(p) ?? null;
  });
}
