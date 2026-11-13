'use client';

import { LanguageSwitch, useLanguage } from './language';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
export default function Auth({
  recovery = false,
  done,
  back
}: {
  recovery?: boolean;
  done: () => void;
  back: () => void;
}) {
  const {
    t
  } = useLanguage();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login'),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function submit() {
    if (!supabase) return;
    setBusy(true);
    setMessage('');
    try {
      if ((recovery || mode === 'signup') && password !== confirm) throw Error(t("两次输入的密码不一致"));
      const redirect = window.location.origin + window.location.pathname;
      const r = recovery ? await supabase.auth.updateUser({
        password
      }) : mode === 'signup' ? await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirect
        }
      }) : mode === 'forgot' ? await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirect
      }) : await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (r.error) throw r.error;
      setPassword('');
      setConfirm('');
      if (recovery) {
        done();
        history.replaceState(null, '', location.pathname);
      }
      setMessage(recovery ? t("密码已更新") : mode === 'signup' ? t("请检查邮箱并点击验证链接。若已有账号，请返回登录或重置密码。") : mode === 'forgot' ? t("若此邮箱已注册，你将收到重置密码邮件。") : t("登录成功"));
    } catch (e) {
      const m = e instanceof Error ? e.message : t("请求失败");
      setMessage(m === 'Invalid login credentials' ? t("邮箱或密码不正确") : m === 'Email not confirmed' ? t("请先验证邮箱") : m);
    } finally {
      setBusy(false);
    }
  }
  return <div className="auth-shell"><header className="auth-topbar"><button onClick={back}>Soriva.</button><LanguageSwitch /></header><section className="card settings-card"><div className="eyebrow">SORIVA · 自由探索</div><h1>{recovery ? t("设置新密码") : mode === 'signup' ? t("开启你的日语之旅") : mode === 'forgot' ? t("找回密码") : t("欢迎回来")}</h1><p>{t("登录你的账户，保存并同步属于你的学习记录。")}</p>{!supabase ? <p role="alert">云端账号服务尚未配置。原有浏览器记录仍保留，配置完成后可安全迁移。</p> : <form className="auth-form" onSubmit={e => {
        e.preventDefault();
        void submit();
      }}>{!recovery && <label>{t("邮箱")}<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>}{(recovery || mode !== 'forgot') && <label>{t("密码")}<input type="password" required minLength={8} autoComplete={mode === 'login' && !recovery ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} /></label>}{(recovery || mode === 'signup') && <label>{t("确认密码")}<input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label>}<Button disabled={busy} type="submit">{busy ? t("请稍候…") : recovery ? t("保存新密码") : mode === 'login' ? t("登录") : mode === 'signup' ? t("注册") : t("发送重置邮件")}</Button>{!recovery && <div className="button-row">{(['login', 'signup', 'forgot'] as const).filter(x => x !== mode).map(x => <button type="button" className="text-link" key={x} onClick={() => {
            setMode(x);
            setMessage('');
          }}>{x === 'login' ? t("已有账号？登录") : x === 'signup' ? t("创建新账号") : t("忘记密码？")}</button>)}{mode === 'login' && <button type="button" className="text-link" disabled={busy || !email} onClick={async () => {
            setBusy(true);
            try {
              const r = await supabase!.auth.resend({
                type: 'signup',
                email,
                options: {
                  emailRedirectTo: location.origin + location.pathname
                }
              });
              setMessage(r.error?.message ?? t("验证邮件已请求发送，请检查邮箱。"));
            } finally {
              setBusy(false);
            }
          }}>{t("重发验证邮件")}</button>}</div>}</form>}{message && <p role="status">{message}</p>}</section></div>;
}
