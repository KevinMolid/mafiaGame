// src/Functions/bbcode.ts
// Safe(ish) BBCode → HTML for a *small whitelist* of tags.
// Escapes HTML first, then applies a few BBCode replacements.
// Extend carefully if you add more tags.

const escapeHtml = (raw: string) =>
  raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// Allow only hex color values like "ff0000" or "#ff0000".
const isSafeHexColor = (c: string) => /^#?[0-9a-fA-F]{6}$/.test(c);

export function bbcodeToHtml(input: string): string {
  if (!input) return "";

  // 1) Escape HTML to prevent XSS
  let s = escapeHtml(input);

  // 2) Basic formatting
  s = s.replace(/\[b\](.*?)\[\/b\]/gis, "<strong>$1</strong>");
  s = s.replace(/\[i\](.*?)\[\/i\]/gis, "<em>$1</em>");
  s = s.replace(/\[u\](.*?)\[\/u\]/gis, "<u>$1</u>");
  s = s.replace(/\[s\](.*?)\[\/s\]/gis, "<s>$1</s>");

  // 3) Color (whitelisted hex only)
  s = s.replace(
    /\[color=([#0-9a-fA-F]{3,9})\](.*?)\[\/color\]/gis,
    (_m, hex, inner) => {
      const safe = isSafeHexColor(hex) ? (hex.startsWith("#") ? hex : `#${hex}`) : "#ffffff";
      return `<span style="color:${safe}">${inner}</span>`;
    }
  );

  // 4) Size (very limited, map to CSS font-size)
  // e.g. [size=12]text[/size] — only allow 8–48px
  s = s.replace(/\[size=(\d{1,2})\](.*?)\[\/size\]/gis, (_m, num, inner) => {
    const px = Math.min(48, Math.max(8, parseInt(num, 10) || 14));
    return `<span style="font-size:${px}px">${inner}</span>`;
    }
  );

  // 5) Links (very safe subset)
  // [url]https://example.com[/url]  OR  [url=https://example.com]text[/url]
  // Only allow http(s)
  s = s.replace(
    /\[url\](https?:\/\/[^\s\]]+)\[\/url\]/gis,
    (_m, href) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>`
  );
  s = s.replace(
    /\[url=(https?:\/\/[^\s\]]+)\](.*?)\[\/url\]/gis,
    (_m, href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
  );

  // 6) Line breaks
  s = s.replace(/\r\n|\r|\n/g, "<br/>");

  return s;
}

export function stripBBCode(input: string): string {
  let s = input || "";

  // Keep inner text for common tags
  s = s.replace(/\[code[^\]]*\]([\s\S]*?)\[\/code\]/gi, "$1");
  s = s.replace(/\[quote[^\]]*\]([\s\S]*?)\[\/quote\]/gi, "$1");

  // URLs: keep visible text
  s = s.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, "$1");
  s = s.replace(/\[url=(?:'|")?([^\]"']+)(?:'|")?\]([\s\S]*?)\[\/url\]/gi, "$2");

  // Images: drop from preview
  s = s.replace(/\[img[^\]]*\]([\s\S]*?)\[\/img\]/gi, "");

  // Lists: turn [*] into bullets (keeps some structure in preview)
  s = s.replace(/\[\*\]/g, "• ");

  // Strip any remaining [tag]... or [tag=...]
  s = s.replace(/\[(\/)?[a-z0-9*]+(?:=[^\]]+)?\]/gi, "");

  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();

  return s;
}