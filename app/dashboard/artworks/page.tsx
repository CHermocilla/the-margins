'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { configured, supabase, type Work } from '../../../lib/supabase';
import { Artwork, artworkTypes, artworkTypeLabel } from '../../../lib/artworks';

type Entry = Artwork & { signedUrl: string };
type Form = { title: string; description: string; universe: string; art_type: Artwork['art_type']; artist_name: string; artist_url: string; original_year: string; visibility: Artwork['visibility']; work_id: string };
const empty: Form = { title:'', description:'', universe:'', art_type:'personal', artist_name:'', artist_url:'', original_year:'', visibility:'private', work_id:'' };
const accepted: Record<string,string> = { 'image/jpeg':'.jpg', 'image/png':'.png', 'image/webp':'.webp', 'image/gif':'.gif' };
export default function ArtStudio() {
  const [user,setUser] = useState<User|null>(null);
  const [ready,setReady] = useState(false);
  const [email,setEmail] = useState(''); const [password,setPassword] = useState('');
  const [works,setWorks] = useState<Work[]>([]);
  const [items,setItems] = useState<Entry[]>([]);
  const [form,setForm] = useState<Form>(empty);
  const [file,setFile] = useState<File|null>(null);
  const [editing,setEditing] = useState<Entry|null>(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');
  useEffect(() => { if (!supabase) { setReady(true); return; }
    supabase.auth.getUser().then(({data}) => { setUser(data.user); setReady(true); });
    const {data} = supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  },[]);
  useEffect(() => { if (user) void refresh(user.id); else { setItems([]); setWorks([]); } },[user]);
  async function refresh(uid:string) {
    if (!supabase) return;
    const [arts, stories] = await Promise.all([
      supabase.from('artworks').select('*').eq('author_id',uid).order('created_at',{ascending:false}),
      supabase.from('works').select('*').eq('author_id',uid).order('title')
    ]);
    if (arts.error) setMessage(arts.error.message);
    if (stories.error) setMessage(stories.error.message);
    setWorks((stories.data ?? []) as Work[]);
    const list = await Promise.all(((arts.data ?? []) as Artwork[]).map(async a => {
      const {data} = await supabase!.storage.from('margins-artwork').createSignedUrl(a.storage_path,3600);
      return {...a,signedUrl:data?.signedUrl ?? ''};
    }));
    setItems(list);
  }
  async function login(e:React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setBusy(true); setMessage('');
    const {error} = await supabase.auth.signInWithPassword({email,password});
    setBusy(false); if(error) setMessage(error.message);
  }
  function edit(a:Entry) {
    setEditing(a); setFile(null); setMessage('');
    setForm({title:a.title,description:a.description,universe:a.universe,art_type:a.art_type,artist_name:a.artist_name,artist_url:a.artist_url ?? '', original_year:a.original_year ? String(a.original_year) : '',visibility:a.visibility,work_id:a.work_id ?? ''});
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function reset() { setEditing(null); setForm(empty); setFile(null); setMessage(''); }
  async function save(e:React.FormEvent) {
    e.preventDefault();if(!supabase||!user||busy)return;
    if(!form.title.trim()) return setMessage('Enter an artwork title.');
    if(!editing && !file) return setMessage('Choose an image to upload.');
    if(file && (!accepted[file.type] || file.size>8*1024*1024)) return setMessage('Use a JPG, PNG, WebP, or GIF no larger than 8 MB.');
    const year = form.original_year.trim() ? Number(form.original_year) : null;
    if(year !== null && (!Number.isInteger(year) || year<1000 || year>2200)) return setMessage('Please enter a valid four-digit year.');
    if(form.artist_url.trim()) { try {const u=new URL(form.artist_url);if(!['http:','https:'].includes(u.protocol)) throw Error();} catch {return setMessage('Artist link must be an http:// or https:// URL.');} }
    setBusy(true); setMessage('');
    let path=editing?.storage_path ?? '';
    let uploaded=false;
    if(file) {
      path=`${user.id}/${crypto.randomUUID()}${accepted[file.type]}`;
      const {error} = await supabase.storage.from('margins-artwork').upload(path,file,{contentType:file.type,upsert:false});
      if(error) {setBusy(false);return setMessage('Upload failed: '+error.message)}
      uploaded=true;
    }
    const values={ title:form.title.trim(),description:form.description,universe:form.universe.trim()||'Unsorted',art_type:form.art_type,artist_name:form.artist_name.trim(),artist_url:form.artist_url.trim()||null, original_year:year,visibility:form.visibility,work_id:form.work_id||null,storage_path:path };
    const result=editing ? await supabase.from('artworks').update(values).eq('id',editing.id).eq('author_id',user.id) : await supabase.from('artworks').insert({...values,author_id:user.id});
    if(result.error) {
      if(uploaded) await supabase.storage.from('margins-artwork').remove([path]);
      setMessage('Save failed: '+result.error.message);
    } else {
      if(editing && uploaded) await supabase.storage.from('margins-artwork').remove([editing.storage_path]);
      reset();setMessage('Artwork saved.');await refresh(user.id);
    }
    setBusy(false);
  }
  async function remove(a:Entry) {
    if(!supabase||!user||busy||!confirm(`Delete "${a.title}"? This removes its image too.`))return;
    setBusy(true);setMessage('');
    const {error}=await supabase.from('artworks').delete().eq('id',a.id).eq('author_id',user.id);
    if(error) setMessage('Delete failed: '+error.message);
    else {const {error:storageError}=await supabase.storage.from('margins-artwork').remove([a.storage_path]);if(storageError)setMessage('Entry deleted, but image cleanup failed: '+storageError.message);else setMessage('Artwork deleted.');if(editing?.id===a.id)reset();await refresh(user.id);}
    setBusy(false);
  }
  if(!configured)return <main className="studio"><h1>Supabase not configured</h1></main>;
  if(!ready)return <main className="studio"><p>Checking session…</p></main>;
  if(!user)return <main className="studio"><div className="studio-head"><div><div className="kicker">AUTHOR ACCESS</div><h1>Art studio</h1><p>Sign in with your existing Margins author account.</p></div></div><form className="login-panel" onSubmit={login}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="primary" disabled={busy}>Sign in</button><p role="status">{message}</p></form></main>;
  return <main className="studio art-studio"><div className="studio-head"><div><div className="kicker">THE MARGINS / VISUAL ARCHIVE</div><h1>Art studio</h1><p>Upload your drawings and commissions, then choose which ones to publish.</p><p><Link href="/dashboard">← Writing studio</Link> · <Link href="/gallery">View gallery →</Link></p></div><button onClick={()=>supabase?.auth.signOut()}>Sign out</button></div>
    <div className="art-studio-layout"><form className="art-upload-form" onSubmit={save}>
      <h2>{editing?'Edit artwork':'Add artwork'}</h2>
      <label>Title<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} maxLength={200} required/></label>
      <label>Image {editing?'(optional replacement)':'(required)'}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>setFile(e.target.files?.[0]??null)} required={!editing}/></label>
      <p className="gallery-hint">JPG, PNG, WebP, or GIF · max 8 MB. Images are stored privately until you publish their entries.</p>
      <label>Description<textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <label>Universe<input list="art-universes" value={form.universe} onChange={e=>setForm({...form,universe:e.target.value})} placeholder="e.g. LAVELLÉ"/><datalist id="art-universes">{[...new Set([...works.map(w=>w.universe),...items.map(a=>a.universe)])].filter(Boolean).map(u=><option key={u} value={u}/>)}</datalist></label>
      <label>Artwork type<select value={form.art_type} onChange={e=>setForm({...form,art_type:e.target.value as Form['art_type']})}>{artworkTypes.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
      <label>Artist credit<input value={form.artist_name} onChange={e=>setForm({...form,artist_name:e.target.value})} placeholder="Artist name or handle"/></label>
      <label>Artist portfolio (optional)<input type="url" value={form.artist_url} onChange={e=>setForm({...form,artist_url:e.target.value})} placeholder="https://..."/></label>
      <label>Year (optional)<input inputMode="numeric" value={form.original_year} onChange={e=>setForm({...form,original_year:e.target.value})} placeholder="2026" maxLength={4}/></label>
      <label>Related story (optional)<select value={form.work_id} onChange={e=>setForm({...form,work_id:e.target.value})}><option value="">None</option>{works.map(w=><option key={w.id} value={w.id}>{w.title}</option>)}</select></label>
      <label>Visibility<select value={form.visibility} onChange={e=>setForm({...form,visibility:e.target.value as Form['visibility']})}><option value="private">Private — only me</option><option value="public">Public — gallery</option></select></label>
      <div className="art-form-actions"><button className="primary" disabled={busy}>{busy?'Saving…':editing?'Save changes':'Upload artwork'}</button>{editing&&<button type="button" onClick={reset}>Cancel editing</button>}</div>
      <p role="status">{message}</p>
    </form><section className="art-manage-list"><h2>My artwork <small>{items.length}</small></h2>{items.length===0?<p>No artwork uploaded yet.</p>:items.map(a=><article className="art-manage-item" key={a.id}>
      {a.signedUrl&&<img src={a.signedUrl} alt={a.title}/>}<div><strong>{a.title}</strong><small>{a.universe} · {artworkTypeLabel(a.art_type)} · {a.visibility}</small><div className="art-manage-actions"><button type="button" onClick={()=>edit(a)}>Edit</button><button type="button" onClick={()=>remove(a)} disabled={busy}>Delete</button></div></div>
    </article>)}</section></div>
  </main>;
}
