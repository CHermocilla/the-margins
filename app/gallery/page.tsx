'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { configured, supabase } from '../../lib/supabase';
import { Artwork, artworkTypeLabel, safeArtistUrl } from '../../lib/artworks';

type DisplayArtwork = Artwork & { signedUrl: string };
export default function GalleryPage() {
  const [artworks, setArtworks] = useState<DisplayArtwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [universe, setUniverse] = useState('all');
  const [kind, setKind] = useState('all');
  const [selected, setSelected] = useState<DisplayArtwork | null>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabase) { setError('Gallery is not configured yet.'); setLoading(false); return; }
      const { data, error } = await supabase.from('artworks').select('*').eq('visibility', 'public').order('created_at', { ascending: false });
      if (cancelled) return;
      if (error) { setError(error.message); setLoading(false); return; }
      const rows = (data ?? []) as Artwork[];
      const result = await Promise.all(rows.map(async art => {
        const { data: signed } = await supabase!.storage.from('margins-artwork').createSignedUrl(art.storage_path, 60 * 60);
        return signed?.signedUrl ? { ...art, signedUrl: signed.signedUrl } : null;
      }));
      if (!cancelled) { setArtworks(result.filter((v): v is DisplayArtwork => Boolean(v))); setLoading(false); }
    }
    void load(); return () => { cancelled = true; };
  }, []);
  const universes = useMemo(() => [...new Set(artworks.map(a => a.universe || 'Unsorted'))].sort(), [artworks]);
  const visible = useMemo(() => artworks.filter(a => (universe === 'all' || a.universe === universe) && (kind === 'all' || a.art_type === kind)), [artworks, universe, kind]);
  const groups = useMemo(() => [...new Set(visible.map(a => a.universe || 'Unsorted'))], [visible]);
  return <main className="gallery-page">
    <div className="gallery-intro"><span className="kicker">THE VISUAL ARCHIVE</span><h1>Gallery</h1><p>Illustrations, commissions, and artwork from other worlds.</p></div>
    <div className="gallery-filters" aria-label="Gallery filters">
      <label>Universe<select value={universe} onChange={e => setUniverse(e.target.value)}><option value="all">All universes</option>{universes.map(u => <option key={u} value={u}>{u}</option>)}</select></label>
      <label>Art type<select value={kind} onChange={e => setKind(e.target.value)}><option value="all">All artwork</option><option value="personal">Personal art</option><option value="commission">Commissions</option><option value="gift">Gifts</option><option value="collaboration">Collaborations</option></select></label>
      <span className="gallery-count">{visible.length} artworks</span>
    </div>
    {!configured || error ? <p role="alert">{error || 'Supabase is not configured.'}</p> : loading ? <p>Loading artwork…</p> : !visible.length ? <p className="gallery-empty">Nothing on this shelf yet. <Link href="/dashboard/artworks">Manage artwork</Link></p> :
      groups.map(g => <section className="gallery-group" key={g}><h2>{g}</h2><div className="art-grid">{visible.filter(a => (a.universe || 'Unsorted') === g).map(a => <button className="art-card" type="button" key={a.id} onClick={() => setSelected(a)} aria-label={'View '+a.title}>
        <span className="art-image-frame"><img src={a.signedUrl} alt={a.description || a.title} loading="lazy" /></span>
        <strong>{a.title}</strong><small>{artworkTypeLabel(a.art_type)}{a.artist_name ? ' · '+a.artist_name : ''}</small>
      </button>)}</div></section>)}
    {selected && <div className="art-modal-backdrop" role="presentation" onClick={() => setSelected(null)}><div className="art-modal" role="dialog" aria-modal="true" aria-label={selected.title} onClick={e => e.stopPropagation()}><button className="art-modal-close" type="button" onClick={() => setSelected(null)}>✕ Close</button><img src={selected.signedUrl} alt={selected.description || selected.title}/><div className="art-modal-caption"><h2>{selected.title}</h2><p>{selected.description}</p><p>Universe: {selected.universe} · {artworkTypeLabel(selected.art_type)}{selected.original_year ? ` · ${selected.original_year}` : ''}</p>{selected.artist_name && <p>Art by {safeArtistUrl(selected.artist_url) ? <a href={safeArtistUrl(selected.artist_url)!} target="_blank" rel="noopener noreferrer">{selected.artist_name}</a> : selected.artist_name}</p>}</div></div></div>}
  </main>;
}
