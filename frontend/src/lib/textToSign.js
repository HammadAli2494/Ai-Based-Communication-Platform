import { SIGN_PHRASES, SIGN_VIDEOS } from "./signDictionary";

function cleanToken(token) {
  return token.toLowerCase().replace(/[^a-z]/g, "");
}

/**
 * Turn spoken text into an ordered list of sign video URLs.
 * Unknown words are skipped (no letter videos in dataset yet).
 */
export function textToSignQueue(text) {
  if (!text?.trim()) return [];

  const normalized = text.trim().replace(/\s+/g, " ").toLowerCase();
  const queue = [];
  let remaining = normalized;

  while (remaining.length > 0) {
    remaining = remaining.replace(/^[\s.,!?]+/, "").trim();
    if (!remaining) break;

    let matched = false;

    const sortedPhrases = [...SIGN_PHRASES].sort(
      (a, b) => b.phrase.length - a.phrase.length,
    );

    for (const { phrase, key } of sortedPhrases) {
      if (remaining.startsWith(phrase)) {
        const nextChar = remaining[phrase.length];
        if (!nextChar || /[\s.,!?]/.test(nextChar)) {
          const src = SIGN_VIDEOS[key];
          if (src) {
            queue.push({ label: phrase, src });
          }
          remaining = remaining.slice(phrase.length);
          matched = true;
          break;
        }
      }
    }

    if (matched) continue;

    const spaceIndex = remaining.search(/[\s.,!?]/);
    const rawToken = spaceIndex === -1 ? remaining : remaining.slice(0, spaceIndex);
    const token = cleanToken(rawToken);

    if (token && SIGN_VIDEOS[token]) {
      queue.push({ label: token, src: SIGN_VIDEOS[token] });
    }

    remaining = spaceIndex === -1 ? "" : remaining.slice(spaceIndex);
  }

  return queue;
}
