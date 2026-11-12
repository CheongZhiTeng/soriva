'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {supabase} from './supabase';
import type {Lesson} from './content';
import type {State} from './domain';
import {lessonUnlocked,lessonPassed} from './domain';
import {emptyState,parseState} from './cloud-state';
export function useJourney(){
 const [state,setState]=useState<State>(emptyState),[ready,setReady]=useState(false),[loaded,setLoaded]=useState(false),[user,setUser]=useState<User|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[recovery,setRecovery]=useState(false),[admin,setAdmin]=useState(false),[courses,setCourses]=useState<Lesson[]>([]);
 const uid=useRef<string|null>(null),generation=useRef(0),lock=useRef(false);
 const refresh=useCallback(async()=>{if(!supabase||!uid.current)return;const id=uid.current,g=++generation.current;const r=await supabase.rpc('journey_load');if(r.error)throw r.error;if(id===uid.current&&g===generation.current){setState(parseState(JSON.stringify(r.data.data)));setLoaded(true);setError('');setCourses(r.data.courses)}},[]);
 useEffect(()=>{if(!supabase){setReady(true);return}let live=true;const accept=(u:User|null)=>{if(!live)return;if(uid.current!==u?.id){if(uid.current){try{for(const k of Object.keys(sessionStorage))if(k.startsWith('soriva-draft:'+uid.current+':'))sessionStorage.removeItem(k)}catch{}}uid.current=u?.id??null;setLoaded(false);generation.current++;setState(emptyState());setCourses([]);setAdmin(false);setError('')}setUser(u);setReady(true);if(u){void supabase!.rpc('is_admin').then(r=>{if(live&&uid.current===u.id)setAdmin(r.data===true)});}if(u)void refresh().catch(e=>{if(live&&uid.current===u.id)setError(e.message)})};
 const timeout=setTimeout(()=>{if(live){setReady(true);setError('连接超时，请重试 / Connection timed out')}},15000);const {data:{subscription}}=supabase.auth.onAuthStateChange((event,s)=>{if(event==='PASSWORD_RECOVERY')setRecovery(true);setTimeout(()=>accept(s?.user??null),0)});
 supabase.auth.getSession().then(({data,error})=>{if(error&&live)setError(error.message);accept(data.session?.user??null)}).catch(e=>{if(live){setError(e.message);setReady(true)}});
 return()=>{clearTimeout(timeout);live=false;uid.current=null;generation.current++;subscription.unsubscribe()}
 },[refresh]);
 useEffect(()=>{document.documentElement.dataset.theme=state.preferences.dark?'dark':'light'},[state.preferences.dark]);
 useEffect(()=>{const sync=()=>{if(document.visibilityState==='visible')void refresh().catch(e=>setError(e.message))};window.addEventListener('focus',sync);window.addEventListener('online',sync);const timer=setInterval(sync,30000);return()=>{clearInterval(timer);window.removeEventListener('focus',sync);window.removeEventListener('online',sync)}},[refresh]);
 const update=useCallback(async(action:string,_payload:Record<string,unknown>,apply:(s:State)=>State)=>{if(!supabase||!uid.current)throw Error('请先登录');if(lock.current)throw Error('正在同步，请稍后再试');if(action==='publish'){const r=await supabase.rpc('journey_publish',{lesson:_payload.lesson as Lesson});if(r.error)throw r.error;await refresh();return;}const id=uid.current;lock.current=true;setBusy(true);try{for(let i=0;i<3;i++){const r=await supabase.rpc('journey_load');if(r.error)throw r.error;if(uid.current!==id)throw Error('账户已切换，请重新操作');const current=parseState(JSON.stringify(r.data.data));const next=apply(current);next.unlocked=[...new Set([...(current.unlocked??[]),...Array.from({length:11},(_,i)=>i+1).filter(n=>lessonUnlocked(current,n)||lessonUnlocked(next,n)).map(n=>'lesson-'+n)])];if(action==='lesson'){const p=_payload as {id:string;status:string;event?:{at:string}};const lesson=next.lessons[p.id];if(lesson)Object.assign(lesson,p.status==='completed'?{completedAt:p.event?.at??new Date().toISOString()}:{startedAt:p.event?.at??new Date().toISOString()})}const saved=await supabase.rpc('journey_save',{next_data:next,expected_revision:r.data.revision,expected_user:id});if(saved.error){if(saved.error.message.includes('revision_conflict'))continue;throw saved.error}await refresh();return}throw Error('其他设备正在更新，请重试；此次更改尚未保存')}finally{lock.current=false;setBusy(false)}},[refresh]);
 return {state,ready,loaded,user,admin,courses,error,setError,busy,update,demo:false,refresh,recovery,setRecovery};
}
