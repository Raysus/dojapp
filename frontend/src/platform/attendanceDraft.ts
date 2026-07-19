import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export type AttendanceDraftItem = { userId: string; name: string; present: boolean };

export type AttendanceDraft = {
  dojoId: string;
  date: string;
  items: AttendanceDraftItem[];
  updatedAt: string;
  pendingSync: boolean;
};

function draftKey(dojoId: string, date: string) {
  return `attendance_draft:${dojoId}:${date}`;
}

async function getRaw(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    const { value } = await Preferences.get({ key });
    return value;
  }
  return localStorage.getItem(key);
}

async function setRaw(key: string, value: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.set({ key, value });
    return;
  }
  localStorage.setItem(key, value);
}

async function removeRaw(key: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Preferences.remove({ key });
    return;
  }
  localStorage.removeItem(key);
}

export async function loadAttendanceDraft(
  dojoId: string,
  date: string,
): Promise<AttendanceDraft | null> {
  const raw = await getRaw(draftKey(dojoId, date));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AttendanceDraft;
  } catch {
    return null;
  }
}

export async function saveAttendanceDraft(draft: AttendanceDraft): Promise<void> {
  await setRaw(draftKey(draft.dojoId, draft.date), JSON.stringify(draft));
}

export async function clearAttendanceDraft(dojoId: string, date: string): Promise<void> {
  await removeRaw(draftKey(dojoId, date));
}
