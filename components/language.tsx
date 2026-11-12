'use client';
import {createContext,useContext,useEffect,useState} from 'react';
import translations from '@/lib/ui-translations.json';
export type Locale='zh'|'en';
const Context=createContext({locale:'zh' as Locale,setLocale:(_l:Locale)=>{}});
export function LanguageProvider({children}:{children:React.ReactNode}){const [locale,setValue]=useState<Locale>('zh');useEffect(()=>{try{setValue(localStorage.getItem('soriva-language')==='en'?'en':'zh')}catch{}},[]);useEffect(()=>{document.documentElement.lang=locale==='en'?'en':'zh-CN'},[locale]);function setLocale(l:Locale){setValue(l);try{localStorage.setItem('soriva-language',l)}catch{}}return <Context.Provider value={{locale,setLocale}}>{children}</Context.Provider>}
export function useLanguage(){const c=useContext(Context);return {...c,t:(text:string)=>c.locale==='en'?(translations as Record<string,string>)[text]??text:text}}
export function LanguageSwitch({onChange}:{onChange?:(l:Locale)=>void}){const {locale,setLocale}=useLanguage();return <select className="language-switch" aria-label="语言 / Language" value={locale} onChange={e=>{const l=e.target.value as Locale;setLocale(l);onChange?.(l)}}><option value="zh">中文</option><option value="en">English</option></select>}
