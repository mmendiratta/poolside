import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 48);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export interface ParticipantSession { participantId: string; sessionToken: string; name: string; }

export function getSession(eventId: string): ParticipantSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("poolside_sessions");
    if (!raw) return null;
    return (JSON.parse(raw) as Record<string, ParticipantSession>)[eventId] ?? null;
  } catch { return null; }
}

export function setSession(eventId: string, session: ParticipantSession): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("poolside_sessions");
    const sessions = raw ? JSON.parse(raw) : {};
    sessions[eventId] = session;
    localStorage.setItem("poolside_sessions", JSON.stringify(sessions));
  } catch {}
}

export function getManagerToken(eventId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("poolside_manager");
    if (!raw) return null;
    return (JSON.parse(raw) as Record<string, string>)[eventId] ?? null;
  } catch { return null; }
}

export function setManagerToken(eventId: string, token: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("poolside_manager");
    const tokens = raw ? JSON.parse(raw) : {};
    tokens[eventId] = token;
    localStorage.setItem("poolside_manager", JSON.stringify(tokens));
  } catch {}
}

export function formatTimeRemaining(closesAt: string): string {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function isPoolClosed(closesAt: string | null): boolean {
  if (!closesAt) return false;
  return new Date(closesAt).getTime() < Date.now();
}
