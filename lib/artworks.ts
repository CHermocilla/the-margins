export type Artwork = {
  id: string;
  author_id: string;
  title: string;
  description: string;
  universe: string;
  art_type: 'personal' | 'commission' | 'gift' | 'collaboration';
  artist_name: string;
  artist_url: string | null;
  original_year: number | null;
  visibility: 'public' | 'private';
  storage_path: string;
  work_id: string | null;
  created_at: string;
};
export const artworkTypes = [
  { value: 'personal', label: 'Personal artwork' },
  { value: 'commission', label: 'Commission' },
  { value: 'gift', label: 'Gift artwork' },
  { value: 'collaboration', label: 'Collaboration' },
] as const;
export function artworkTypeLabel(type: Artwork['art_type']) {
  return artworkTypes.find(item => item.value === type)?.label ?? type;
}
export function safeArtistUrl(value: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null; } catch { return null; }
}
