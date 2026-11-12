import {z} from 'zod';
import {initialState,type State} from './domain';
export const LEGACY_KEY='japanese-journey-v1';
const obj=z.record(z.string(),z.unknown());
const record=z.object({id:z.string().min(1)}).passthrough();
export const stateSchema=z.object({version:z.literal(1),lessons:z.record(z.string(),z.object({status:z.enum(['started','completed'])}).passthrough()),vocabulary:z.record(z.string(),z.object({status:z.enum(['new','learning','mastered']),favorite:z.boolean()}).passthrough()),hiragana:z.record(z.string(),z.object({correct:z.number().nonnegative(),total:z.number().nonnegative()}).passthrough()),attempts:z.array(record.extend({at:z.string(),lessonId:z.string(),score:z.number(),total:z.number(),answers:obj,questions:z.array(obj)})),events:z.array(record.extend({at:z.string(),kind:z.string(),label:z.string()})),sessions:z.array(record.extend({at:z.string(),seconds:z.number().nonnegative()})),preferences:z.object({dark:z.boolean(),romaji:z.boolean(),reminder:z.boolean()}).passthrough(),customLessons:z.array(record)}).passthrough();
export function parseState(raw:string):State{return stateSchema.parse(JSON.parse(raw)) as unknown as State}
export function emptyState():State{return {...initialState(),lessons:{}}}
export function canonical(value:unknown):string{if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';return JSON.stringify(value)}
export async function fingerprint(raw:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')}
// A conflicting ID is never overwritten silently. The preview blocks import until resolved.
export function mergeStates(cloud:State,local:State){const result=structuredClone(cloud),conflicts:string[]=[];
for(const key of ['lessons','vocabulary','hiragana','katakana'] as const){const target=(result[key]??={}) as Record<string,unknown>;for(const [id,value] of Object.entries(local[key]??{})){if(id in target&&canonical(target[id])!==canonical(value))conflicts.push(key+': '+id);else target[id]=value}}
for(const key of ['attempts','events','sessions','customLessons','practiceRuns'] as const){const target=(result[key]??=[]) as {id:string}[];for(const value of local[key]??[]){const old=target.find(x=>x.id===value.id);if(!old)target.push(value);else if(canonical(old)!==canonical(value))conflicts.push(key+': '+value.id)}}
return {state:result,conflicts}}
export function downloadBackup(raw:string){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.href=url;a.download='japanese-journey-original-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
