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
