import { useSyncExternalStore } from "react";
import { currentUser as defaultUser, currentMember as defaultMember } from "./mock-data";
import { supabase } from "@/integrations/supabase/client";

export type UserProfile = {
  name: string;
  mobile: string; // e.g. "+91 9876543210"
  location: string;
};

export type MemberProfile = {
  name: string;
  mobile: string;
  category: string; // slug
  area: string;
  experience: string;
  hourlyRate: string;
  bio: string;
};

type State = {
  user: UserProfile;
  member: MemberProfile | null;
};

const USER_KEY = "lc:user-profile";
const MEMBER_KEY = "lc:member-profile";

function load(): State {
  let user: UserProfile = {
    name: defaultUser.name,
    mobile: defaultUser.mobile,
    location: defaultUser.location,
  };
  let member: MemberProfile | null = null;
  if (typeof window !== "undefined") {
    try {
      const u = localStorage.getItem(USER_KEY);
      if (u) user = JSON.parse(u);
      const m = localStorage.getItem(MEMBER_KEY);
      if (m) member = JSON.parse(m);
    } catch {
      // ignore
    }
  }
  return { user, member };
}

let state: State = load();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setUserProfile(u: UserProfile) {
  state = { ...state, user: u };
  if (typeof window !== "undefined") localStorage.setItem(USER_KEY, JSON.stringify(u));
  emit();
}

export function setMemberProfile(m: MemberProfile) {
  state = { ...state, member: m };
  if (typeof window !== "undefined") localStorage.setItem(MEMBER_KEY, JSON.stringify(m));
  emit();
}

export async function saveUserProfile(u: UserProfile, passwordHash?: string) {
  setUserProfile(u);
  try {
    const row: Record<string, unknown> = {
      full_name: u.name,
      mobile: u.mobile,
      location: u.location,
      role: "customer",
    };
    if (passwordHash) row.password_hash = passwordHash;
    const { data, error } = await supabase
      .from("profiles")
      .upsert(row, { onConflict: "mobile" })
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (data?.id && typeof window !== "undefined") {
      localStorage.setItem("lc:user-id", data.id);
    }
    return data?.id ?? null;
  } catch (e) {
    console.error("saveUserProfile failed", e);
    return null;
  }
}


export async function saveMemberProfile(m: MemberProfile, passwordHash?: string) {
  setMemberProfile(m);
  try {
    const row: Record<string, unknown> = {
      full_name: m.name,
      mobile: m.mobile,
      location: m.area,
      role: "worker",
    };
    if (passwordHash) row.password_hash = passwordHash;
    const { data: profile, error: pErr } = await supabase
      .from("profiles")
      .upsert(row, { onConflict: "mobile" })
      .select("id")
      .maybeSingle();
    if (pErr) throw pErr;
    const profileId = profile?.id;
    if (!profileId) return null;

    const { data: worker, error: wErr } = await supabase
      .from("worker_profiles")
      .insert({
        user_id: profileId,
        service_category: m.category,
        years_of_experience: m.experience ? parseInt(m.experience, 10) : null,
        hourly_rate: m.hourlyRate ? Number(m.hourlyRate) : null,
        bio: m.bio,
        status: "pending",
      })
      .select("id")
      .maybeSingle();
    if (wErr) throw wErr;
    if (typeof window !== "undefined") {
      localStorage.setItem("lc:member-profile-id", profileId);
      if (worker?.id) localStorage.setItem("lc:worker-id", worker.id);
    }
    return worker?.id ?? null;
  } catch (e) {
    console.error("saveMemberProfile failed", e);
    return null;
  }
}


function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return { user: { name: defaultUser.name, mobile: defaultUser.mobile, location: defaultUser.location }, member: null };
}

export function useProfileStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useUserProfile() {
  return useProfileStore().user;
}

export function useMemberProfile() {
  return useProfileStore().member ?? {
    name: defaultMember.name,
    mobile: defaultMember.mobile,
    category: "ac-repair",
    area: defaultMember.area,
    experience: "10",
    hourlyRate: "299",
    bio: "",
  };
}
