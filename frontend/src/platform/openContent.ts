import { Browser } from '@capacitor/browser';
import { isNativeApp } from './native';

export async function openExternalUrl(url: string): Promise<void> {
  if (isNativeApp()) {
    await Browser.open({ url, presentationStyle: 'fullscreen' });
    return;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

export function isYouTubeUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes('youtube.com') || host.includes('youtu.be');
  } catch {
    return false;
  }
}

export function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

export function toYouTubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }

  return null;
}

export function toYouTubeWatchUrl(url: string): string {
  const embed = toYouTubeEmbed(url);
  if (!embed) return url;

  const id = embed.split('/embed/')[1];
  return id ? `https://www.youtube.com/watch?v=${id}` : url;
}
