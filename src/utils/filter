/**
 * Phone Number Filter Utility for IndiStay Guest & Hotel Chat
 * Enforces platform safety by preventing phone number exchange.
 */

export function containsPhoneNumber(text: string): boolean {
  if (!text || typeof text !== 'string') return false;

  const normalized = text.trim();

  // 1. Matches phone numbers (standard, formatted, and spaced-out digits)
  // e.g. +91 98765 43210, 98765-43210, 09876543210, (987) 654-3210, 9 8 7 6 5 4 3 2 1 0
  const spacedPhoneRegex = /(?:(?:\+|0{1,2})[\s.-]*)?(?:\(?\d{1,4}\)?[\s.-]*)?(?:\d[\s.,\-_*#/()~]{0,3}){6,14}\d/;
  if (spacedPhoneRegex.test(normalized)) {
    return true;
  }

  // 2. Window check: if an evasive cluster has 8+ digits in close proximity
  for (let i = 0; i < normalized.length; i++) {
    const windowChunk = normalized.slice(i, i + 25);
    const digits = windowChunk.replace(/\D/g, '');
    if (digits.length >= 8) {
      const nonWhitespace = windowChunk.replace(/\s/g, '');
      if (digits.length / nonWhitespace.length >= 0.45) {
        return true;
      }
    }
  }

  // 3. Spelled-out English digits (e.g. "nine eight seven six five four three")
  const numberWords = /\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/gi;
  const wordMatches = normalized.match(numberWords);
  if (wordMatches && wordMatches.length >= 7) {
    return true;
  }

  return false;
}

export const PHONE_BLOCKED_MESSAGE =
  'Sharing phone numbers or direct contact numbers is prohibited for platform safety. Please communicate directly through this chat.';
