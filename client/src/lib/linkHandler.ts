/**
 * Cross-platform “smart link” helper
 *
 *  • Tries to open a link in its native app first (Facebook, Instagram, Spotify, etc.).
 *  • If the app is not installed or the deep-link is blocked, it silently falls back to
 *    the public https URL in a new tab.
 *
 * IMPORTANT LIMITATIONS
 *  – Mobile browsers allow only one navigation attempt triggered by a user click.
 *  – Replit’s in-browser preview is sandboxed; deep-links never fire there.
 *    Test on a real device or a normal mobile browser tab.
 */

type Mapping = {
  test: (u: URL) => boolean;
  toApp: (u: URL) => string; // e.g. “fb://page/123”
};

const mappings: Mapping[] = [
  /* ────────── FACEBOOK ──────────────────────────────────────────── */
  {
    test: (u) => /facebook\.com$/i.test(u.hostname),
    toApp: (u) => {
      // Handles both  /<pagename>  and  /profile.php?id=<numeric>
      const idParam = u.searchParams.get("id");
      const firstSeg = u.pathname.split("/").filter(Boolean)[0] ?? "";
      const handle = idParam || firstSeg;

      // numeric → profile, text → page
      return /^\d+$/.test(handle)
        ? `fb://profile/${handle}`
        : `fb://page/${handle}`;
    },
  },

  /* ────────── INSTAGRAM ─────────────────────────────────────────── */
  {
    test: (u) => /instagram\.com$/i.test(u.hostname),
    toApp: (u) => {
      const username = u.pathname.split("/").filter(Boolean)[0];
      return `instagram://user?username=${username}`;
    },
  },

  /* ────────── SPOTIFY (track / episode / show) ──────────────────── */
  {
    test: (u) => /spotify\.com$/i.test(u.hostname),
    toApp: (u) => {
      // /episode/<id> , /track/<id> , /show/<id>
      const [, type, id] = u.pathname.split("/");
      return `spotify:${type}:${id}`;
    },
  },
];

/* ────────── shared helper ───────────────────────────────────────── */
function openWithFallback(appURL: string, webURL: string) {
  // 1) Try native-app deep link
  window.location.href = appURL;

  // 2) If nothing happened in 1.2 s, fall back to the web URL
  const timer = setTimeout(() => {
    window.open(webURL, "_blank", "noopener,noreferrer");
  }, 1200);

  // If the page became hidden (user switched to the app) cancel the fallback
  window.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeout(timer);
  });
}

/* ────────── public API ──────────────────────────────────────────── */
export function openSmartLink(raw: string) {
  if (!raw) return;

  try {
    const url = new URL(raw);

    // Use the first mapping that matches the hostname
    const match = mappings.find((m) => m.test(url));
    if (match) {
      openWithFallback(match.toApp(url), raw);
    } else {
      // Unknown hostname → just open in new tab
      window.open(raw, "_blank", "noopener,noreferrer");
    }
  } catch (err) {
    console.error("[openSmartLink] Bad URL:", err);
    window.open(raw, "_blank", "noopener,noreferrer");
  }
}

/* Legacy alias */
export const openLink = openSmartLink;
