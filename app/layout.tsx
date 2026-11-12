import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'Soriva · 自由探索',description:'自由探索属于自己的语言天空。Soriva.',icons:{icon:'/soriva-icon-v2.svg'},openGraph:{title:'Soriva · 自由探索',description:'Your language. Your open sky.'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
