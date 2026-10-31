/** Convert stored plain-text chapters to editor-friendly HTML without modifying saved data. */
export function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export function isFormattedChapter(value: string) {
  return /^\s*<(?:p|h[1-6]|blockquote|ul|ol|hr|div|pre|strong|em)\b/i.test(value);
}
export function chapterToHtml(value: string) {
  if (!value.trim()) return '<p></p>';
  if (isFormattedChapter(value)) return value;
  return value.split(/\n\s*\n/).map(block => {
    if (/^[-–—_\s]{3,}$/.test(block.trim())) return '<hr>';
    return `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`;
  }).join('');
}
/** Convert new formatted chapters to countable text (including block breaks). */
export function readableText(value: string) {
  if (!isFormattedChapter(value)) return value;
  return value.replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<\/(?:p|h[1-6]|li|blockquote|div)>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'");
}
export function chapterWordCount(value: string) {
  const text = readableText(value).trim();
  return text ? text.split(/\s+/u).length : 0;
}
