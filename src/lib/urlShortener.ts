export interface ShortenResult {
  shortUrl: string;
  longUrl: string;
  provider: string;
}

const SESSION_KEY_PREFIX = 'projectui.shorturl.';

export function getCachedShortUrl(longUrl: string): string | null {
  try {
    return sessionStorage.getItem(SESSION_KEY_PREFIX + longUrl);
  } catch {
    return null;
  }
}

function setCachedShortUrl(longUrl: string, shortUrl: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY_PREFIX + longUrl, shortUrl);
  } catch {
    /* quota */
  }
}

export async function shortenUrl(longUrl: string): Promise<ShortenResult> {
  const cached = getCachedShortUrl(longUrl);
  if (cached) {
    return { shortUrl: cached, longUrl, provider: 'is.gd' };
  }
  try {
    const apiUrl = `https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('API error');
    const data = (await res.json()) as { shorturl?: string; errorcode?: number };
    if (data.shorturl) {
      setCachedShortUrl(longUrl, data.shorturl);
      return { shortUrl: data.shorturl, longUrl, provider: 'is.gd' };
    }
    throw new Error('No shorturl in response');
  } catch {
    return { shortUrl: longUrl, longUrl, provider: 'fallback' };
  }
}
