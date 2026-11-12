'use client';

import { useLanguage } from "./language";
import { Avatar } from './expansion';
import { useState } from 'react';
import { useApp } from './shared';
import { Button } from './ui/button';
import { supabase } from '@/lib/supabase';
export default function AccountSettings() {
  const {
    t
  } = useLanguage();
  const {
    state,
    user,
    save,
    busy,
    notify
  } = useApp();
  const [name, setName] = useState(state.profile?.name || ''),
    [avatar, setAvatar] = useState(state.profile?.avatar?.startsWith('data:image/') ? state.profile.avatar : 'avatar-0'),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [working, setWorking] = useState(false);
  return <section className="card settings-card"><h3>{t("个人资料")}</h3><form className="auth-form" onSubmit={async e => {
      e.preventDefault();
      await save('profile', {}, s => ({
        ...s,
        profile: {
          name: name.trim(),
          avatar
        }
      }), '个人资料已保存');
    }}><label>{t("显示名称")}<input maxLength={40} required value={name} onChange={e => setName(e.target.value)} /></label><div className="button-row">{['avatar-0', 'avatar-1', 'avatar-2', 'avatar-3', 'avatar-4'].map(a => <button type="button" className={avatar === a ? 'kana-cell selected' : 'kana-cell'} key={a} aria-label={'头像 ' + a} aria-pressed={avatar === a} onClick={() => setAvatar(a)}><Avatar value={a} /></button>)}</div><label>上传头像（图片不超过 2 MB）<input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (!['image/png', 'image/jpeg', 'image/webp'].includes(f.type)) {
            notify('请选择图片 / Select an image');
            return;
          }
          if (f.size > 2 * 1024 * 1024) {
            notify('图片不能超过 2 MB');
            return;
          }
          try {
            const img = await createImageBitmap(f),
              canvas = document.createElement('canvas');
            canvas.width = canvas.height = 160;
            const c = canvas.getContext('2d')!;
            const size = Math.min(img.width, img.height);
            c.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 160, 160);
            setAvatar(canvas.toDataURL('image/jpeg', .8));
            img.close();
          } catch {
            notify('无法读取图片，请选择 PNG、JPEG 或 WebP');
          }
        }} /></label>{avatar.startsWith('data:image/') && <img className="profile-preview" src={avatar} alt="头像预览" />}<Button disabled={busy}>{t("保存个人资料")}</Button></form><hr /><h3>{t("修改密码")}</h3><form className="auth-form" onSubmit={async e => {
      e.preventDefault();
      if (password !== confirm) {
        notify('两次密码不一致');
        return;
      }
      setWorking(true);
      try {
        const r = await supabase!.auth.updateUser({
          password
        });
        if (r.error) throw r.error;
        setPassword('');
        setConfirm('');
        notify(t("密码已更新"));
      } catch (e) {
        notify(e instanceof Error ? e.message : '密码修改失败');
      } finally {
        setWorking(false);
      }
    }}><label>{t("新密码")}<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label><label>{t("确认新密码")}<input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} /></label><Button disabled={working}>{t("更新密码")}</Button></form></section>;
}
export function Reminders() {
  const {
    t
  } = useLanguage();
  const {
      state,
      save,
      busy
    } = useApp(),
    old = state.reminderConfig;
  const [enabled, setEnabled] = useState(old?.enabled ?? false),
    [time, setTime] = useState(old?.time ?? '19:00'),
    [days, setDays] = useState(old?.days ?? [1, 2, 3, 4, 5, 6, 0]),
    [timezone, setTimezone] = useState(old?.timezone ?? 'Asia/Kuala_Lumpur');
  return <section className="card settings-card"><h3>{t("自定义学习提醒")}</h3><p>按所选时区和星期安排提醒。邮件发送服务尚待配置，当前保存计划但不会声称已发送邮件。</p><form className="auth-form" onSubmit={e => {
      e.preventDefault();
      void save('reminder', {}, s => ({
        ...s,
        reminderConfig: {
          enabled,
          time,
          days,
          timezone
        }
      }), '提醒计划已保存；邮件服务待配置');
    }}><label><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />开启提醒计划</label><label>{t("时间")}<input type="time" required value={time} onChange={e => setTime(e.target.value)} /></label><label>{t("时区")}<select value={timezone} onChange={e => setTimezone(e.target.value)}>{['Asia/Kuala_Lumpur', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'Australia/Sydney', 'UTC'].map(x => <option key={x}>{x}</option>)}</select></label><div className="button-row"><button type="button" onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}>{t("每天")}</button><button type="button" onClick={() => setDays([1, 2, 3, 4, 5])}>{t("工作日")}</button></div><div className="button-row">{['日', '一', '二', '三', '四', '五', '六'].map((d, i) => <button type="button" className={days.includes(i) ? 'kana-cell selected' : 'kana-cell'} key={d} aria-pressed={days.includes(i)} onClick={() => setDays(x => x.includes(i) ? x.filter(v => v !== i) : [...x, i])}>{d}</button>)}</div><Button disabled={busy || enabled && !days.length}>{t("保存提醒")}</Button></form></section>;
}
