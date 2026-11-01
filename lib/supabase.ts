import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url && key);
export const supabase = configured ? createClient(url!, key!, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}) : null;
export type Work = {id:string;author_id:string;slug:string;title:string;summary:string;universe:string;tags:string[];visibility:'draft'|'private'|'public';original_year:number|null;work_status:'ongoing'|'complete'|'hiatus'|'abandoned';created_at:string;updated_at:string};
export type Chapter = {id:string;work_id:string;chapter_number:number;title:string;content:string;word_count:number;is_published:boolean;updated_at:string};
export function countWords(text:string){return text.trim()?text.trim().split(/\s+/u).length:0;}
export function slugify(text:string){return text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)||'untitled';}
