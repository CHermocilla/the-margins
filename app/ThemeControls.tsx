'use client';
import {useEffect,useState} from 'react';
type Mode='light'|'dark';
type Palette='wine'|'forest'|'ocean'|'plum';
const palettes: {id: Palette;label:string;color:string}[]=[
  {id:'wine',label:'Rose',color:'#a76e86'},
  {id:'forest',label:'Forest',color:'#5d9a7d'},
  {id:'ocean',label:'Ocean',color:'#649ec5'},
  {id:'plum',label:'Plum',color:'#ad83ce'}
];
export default function ThemeControls(){
  const [mode,setMode]=useState<Mode>('light');
  const [palette,setPalette]=useState<Palette>('wine');
  useEffect(()=>{
    const html=document.documentElement;
    setMode(html.dataset.mode==='dark'?'dark':'light');
    const saved=html.dataset.palette;
    setPalette(palettes.some(p=>p.id===saved)?saved as Palette:'wine');
  },[]);
  function changeMode(){const next=mode==='light'?'dark':'light';setMode(next);document.documentElement.dataset.mode=next;localStorage.setItem('margins-mode',next);}
  function changePalette(next:Palette){setPalette(next);document.documentElement.dataset.palette=next;localStorage.setItem('margins-palette',next);}
  return <div className="theme-controls" aria-label="Appearance settings">
    <button type="button" className="theme-mode" onClick={changeMode} aria-label={`Switch to ${mode==='light'?'dark':'light'} mode`}>{mode==='light'?'☾ Dark':'☀ Light'}</button>
    {palettes.map(p=><button key={p.id} type="button" className="theme-swatch" style={{'--swatch':p.color} as React.CSSProperties} aria-label={`${p.label} accent`} title={`${p.label} accent`} aria-pressed={palette===p.id} onClick={()=>changePalette(p.id)} />)}
  </div>;
}
