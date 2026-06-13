import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { categoryBySlug } from "@/lib/mock-data";

export type RealWorker = {
  id: string;            // worker_profiles.id
  userId: string;        // profiles.id
  name: string;
  mobile: string;
  category: string;      // service_category slug
  trade: string;         // category display name
  area: string;          // profiles.location
  rating: number;
  startingPrice: number; // hourly_rate
  experience: number;
  bio: string;
  available: boolean;
  status: string;
  initials: string;
  tint: string;
};

const TINTS = [
  "bg-blue-200",
  "bg-emerald-200",
  "bg-amber-200",
  "bg-purple-200",
  "bg-pink-200",
  "bg-violet-200",
  "bg-cyan-200",
  "bg-rose-200",
  "bg-yellow-200",
  "bg-indigo-200",
];

export function initialsFromName(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const out = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return out || "?";
}

export function tintFromId(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
}

function mapRow(row: any): RealWorker {
  const slug: string = row.service_category ?? "";
  const profile = row.profiles ?? {};
  const id: string = row.id;
  const name: string = profile.full_name ?? "Worker";
  return {
    id,
    userId: row.user_id,
    name,
    mobile: profile.mobile ?? "",
    category: slug,
    trade: categoryBySlug(slug)?.name ?? slug,
    area: profile.location ?? "",
    rating: Number(row.rating ?? 0),
    startingPrice: Number(row.hourly_rate ?? 0),
    experience: Number(row.years_of_experience ?? 0),
    bio: row.bio ?? "",
    available: Boolean(row.is_available),
    status: row.status ?? "pending",
    initials: initialsFromName(name),
    tint: tintFromId(id),
  };
}

export async function fetchApprovedWorkers(): Promise<RealWorker[]> {
  const { data, error } = await supabase
    .from("worker_profiles")
    .select(
      "id, user_id, service_category, is_available, status, rating, hourly_rate, bio, years_of_experience, profiles:profiles!worker_profiles_user_id_fkey(full_name, mobile, location)"
    )
    .eq("status", "approved")
    .eq("is_available", true)
    .order("rating", { ascending: false });
  if (error) {
    // Fallback for environments where the FK relationship isn't named — fetch profiles separately
    const basic = await supabase
      .from("worker_profiles")
      .select("id, user_id, service_category, is_available, status, rating, hourly_rate, bio, years_of_experience")
      .eq("status", "approved")
      .eq("is_available", true);
    if (basic.error || !basic.data) throw error;
    const userIds = basic.data.map((r) => r.user_id).filter(Boolean) as string[];
    const profs = userIds.length
      ? await supabase.from("profiles").select("id, full_name, mobile, location").in("id", userIds)
      : { data: [] as any[], error: null };
    const map = new Map((profs.data ?? []).map((p: any) => [p.id, p]));
    return basic.data.map((r: any) => mapRow({ ...r, profiles: map.get(r.user_id) ?? {} }));
  }
  return (data ?? []).map(mapRow);
}

export async function fetchWorkerById(id: string): Promise<RealWorker | null> {
  const { data, error } = await supabase
    .from("worker_profiles")
    .select("id, user_id, service_category, is_available, status, rating, hourly_rate, bio, years_of_experience")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const prof = data.user_id
    ? await supabase.from("profiles").select("id, full_name, mobile, location").eq("id", data.user_id).maybeSingle()
    : { data: null };
  return mapRow({ ...data, profiles: prof.data ?? {} });
}

export function useApprovedWorkers() {
  const [workers, setWorkers] = useState<RealWorker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchApprovedWorkers()
      .then((rows) => {
        if (!cancelled) {
          setWorkers(rows);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message ?? "Failed to load workers");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { workers, loading, error };
}

export function useWorkerById(id: string) {
  const [worker, setWorker] = useState<RealWorker | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWorkerById(id)
      .then((w) => {
        if (!cancelled) setWorker(w);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  return { worker, loading };
}
