'use client';
import Link from 'next/link';
import {useMemo,useState} from 'react';
import {works} from '../lib/data';
export default function Home(){
 const [query,setQuery]=useState('');
 const [tag,setTag]=useState('All tags');
 const allTags=['All tags',...Array.from(new Set(works.flatMap(w=>w.tags)))].sort((a,b)=>a==='All tags'?-1:b==='All tags'?1:a.localeCompare(b));
 const matches=useMemo(()=>works.filter(w=>(tag==='All tags'||w.tags.includes(tag))&&[w.title,w.universe,w.summary,...w.tags].join(' ').toLowerCase().includes(query.trim().toLowerCase())),[query,tag]);
 return <main className="archive-page"><div className="archive-intro"><span className="overline">PERSONAL FICTION ARCHIVE</span><h1>Works</h1><p>A home for stories, alternate universes, and everything in between.</p></div>
 <section className="archive-section" aria-labelledby="works-heading"><div className="index-heading"><h2 id="works-heading">Browse the archive</h2><span>{matches.length} of {works.length} works</span></div>
 <div className="archive-toolbar"><label className="archive-search"><span>Search works</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Title, summary, universe…" /></label><label className="archive-select"><span>Filter by tag</span><select value={tag} onChange={e=>setTag(e.target.value)}>{allTags.map(t=><option key={t}>{t}</option>)}</select></label><button className="clear-filter" type="button" onClick={()=>{setQuery('');setTag('All tags')}} disabled={!query&&tag==='All tags'}>Clear filters</button></div>
 <div className="archive-results">{matches.map(w=><article className="archive-entry" key={w.slug}><div className="entry-main"><div className="entry-line"><Link href={'/works/'+w.slug} className="entry-title">{w.title}</Link><span className="entry-universe">{w.universe}</span></div><p className="entry-summary">{w.summary}</p><div className="entry-tags" aria-label="Story tags">{w.tags.map(t=><button key={t} onClick={()=>setTag(t)} type="button">{t}</button>)}</div></div><div className="entry-meta"><span><strong>Status</strong>{w.status}</span><span><strong>Chapters</strong>{w.chapters}</span><span><strong>Words</strong>{w.words}</span><span><strong>Updated</strong>{w.updated}</span></div></article>)}{matches.length===0&&<p className="no-results">No works match those filters. Try a different search or tag.</p>}</div></section>
 <p className="archive-footnote">This archive currently contains sample entries. Your own works will replace them when the author studio is connected.</p></main>
}
