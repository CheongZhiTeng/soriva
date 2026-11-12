'use client';

import { useLanguage, LanguageSwitch } from "./language";
import { useState } from 'react';
import { Info, LogIn, LogOut, Download, RotateCcw, Plus, CalendarDays, Send } from 'lucide-react';
import { Button } from './ui/button';
import { useApp, Heading, Modal, Toggle, Empty } from './shared';
import { initialState } from '@/lib/domain';
import { supabase } from '@/lib/supabase';
import { firstLesson, type Lesson } from '@/lib/content';
import { lessonSchema } from '@/lib/validation';
import AccountSettings, { Reminders } from './account-settings';
import Migration from './migration';
function Setting({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return <div className="setting-row"><div><h4>{title}</h4><p>{description}</p></div>{children}</div>;
}
export function Preferences() {
  const {
    t
  } = useLanguage();
  const {
      state,
      save,
      demo,
      user,
      busy,
      notify
    } = useApp(),
    [reset, setReset] = useState(false),
    [remove, setRemove] = useState(false),
    [login, setLogin] = useState(false),
    [signup, setSignup] = useState(false),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [authBusy, setAuthBusy] = useState(false);
  function pref(key: 'dark' | 'romaji' | 'reminder', value: boolean) {
    void save('preferences', {
      [key]: value
    }, s => ({
      ...s,
      preferences: {
        ...s.preferences,
        [key]: value
      }
    }), '');
  }
  async function auth() {
    if (!supabase) return;
    setAuthBusy(true);
    try {
      const r = signup ? await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      }) : await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (r.error) throw r.error;
      notify(signup ? '注册已提交，请按邮件提示验证账户。' : t("登录成功"));
      setLogin(false);
      setPassword('');
    } catch (e) {
      notify(e instanceof Error ? e.message : '账户操作失败');
    } finally {
      setAuthBusy(false);
    }
  }
  function exportData() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({
      exportedAt: new Date().toISOString(),
      mode: demo ? 'local-demo' : 'supabase',
      ...state
    }, null, 2)], {
      type: 'application/json'
    }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-japanese-journey.json';
    a.click();
    URL.revokeObjectURL(url);
    notify('学习数据已导出');
  }
  return <><Heading eyebrow="MAKE THIS SPACE YOURS" title={t("偏好设置")} description="让学习的节奏和习惯，都更适合你。" /><div className="settings-layout"><AccountSettings /><Reminders /><section className="card settings-card"><h3>{t("学习与显示")}</h3><Setting title={t("深色模式")} description="在光线较暗时，给眼睛一点舒适。"><Toggle checked={state.preferences.dark} change={v => pref('dark', v)} label={t("深色模式")} /></Setting><Setting title={t("显示罗马音")} description="默认开启。熟悉假名后，可以隐藏来挑战自己。"><Toggle checked={state.preferences.romaji} change={v => pref('romaji', v)} label={t("显示罗马音")} /></Setting><Setting title={t("界面语言")} description={t("随时切换中文或 English，登录后保存到账号。")}><LanguageSwitch onChange={l=>void save("locale",{},s=>({...s,locale:l}),"")}/></Setting></section><section className="card settings-card"><h3>{t("账户与学习记录")}</h3><div className="connection-box"><Info size={22} /><div><b>{demo ? '当前为本地演示模式' : user ? 'Supabase 账户已连接' : '登录后开启云端同步'}</b><p>{demo ? '记录保存在当前浏览器。跨设备同步、真实登录与云端管理需要配置 Supabase；没有虚构的初始成绩。' : user ? user.email : '使用个人账户保存进度，其他用户无法查看。'}</p></div></div>{!demo && <Button variant="outline" onClick={async () => {
          if (user) {
            const r = await supabase!.auth.signOut();
            if (r.error) notify(r.error.message);
          } else setLogin(true);
        }}>{user ? <LogOut size={16} /> : <LogIn size={16} />} {user ? t("退出登录") : '登录 / 注册'}</Button>}<Setting title={t("导出学习数据")} description="下载包含成绩、进度与偏好的 JSON 文件。"><Button variant="outline" onClick={exportData}><Download size={16} />{t("导出")}</Button></Setting><Setting title={t("重置学习进度")} description="删除学习记录；保留课程和偏好。"><Button variant="outline" className="danger-text" onClick={() => setReset(true)}><RotateCcw size={16} />{t("重置")}</Button></Setting>{!demo && user && <Setting title={t("删除账户")} description="永久删除账户及所有私人学习数据。"><Button variant="outline" className="danger-text" onClick={() => setRemove(true)}>{t("删除账户")}</Button></Setting>}</section></div><Migration key={user?.id} /><Modal open={reset} close={() => setReset(false)} title="确认重置学习进度？"><p>将删除所有测验、词汇状态、平假名练习与学习历史。此操作无法撤销，建议先导出记录。</p><div className="button-row"><Button variant="outline" onClick={() => setReset(false)}>{t("取消")}</Button><Button disabled={busy} onClick={async () => {
          if (await save('reset', {}, s => ({
            ...initialState(),
            lessons: {},
            preferences: s.preferences,
            customLessons: s.customLessons,
            profile: s.profile,
            reminderConfig: s.reminderConfig
          }), '学习记录已重置')) setReset(false);
        }}>{t("确认重置")}</Button></div></Modal><Modal open={remove} close={() => setRemove(false)} title="永久删除账户？"><p>这将删除账户及全部私人学习数据，无法恢复。</p><div className="button-row"><Button variant="outline" onClick={() => setRemove(false)}>{t("取消")}</Button><Button disabled={authBusy} onClick={async () => {
          setAuthBusy(true);
          try {
            const r = await supabase!.rpc('delete_my_account');
            if (r.error) throw r.error;
            await supabase!.auth.signOut();
            setRemove(false);
            notify('账户已删除');
          } catch (e) {
            notify(e instanceof Error ? e.message : '删除失败');
          } finally {
            setAuthBusy(false);
          }
        }}>{t("永久删除")}</Button></div></Modal><Modal open={login} close={() => setLogin(false)} title={signup ? t("开启你的日语之旅") : t("欢迎回来")}><form className="auth-form" onSubmit={e => {
        e.preventDefault();
        void auth();
      }}><label>{t("邮箱")}<input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label><label>{t("密码")}<input type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} /></label><Button type="submit" disabled={authBusy}>{authBusy ? t("请稍候…") : signup ? t("注册") : t("登录")}</Button><button type="button" className="text-link" onClick={() => setSignup(!signup)}>{signup ? '已有账户？登录' : '还没有账户？注册'}</button></form></Modal></>;
}
export function Admin() {
  const {
    t
  } = useLanguage();
  const {
      state,
      lessons,
      demo,
      admin,
      save,
      busy
    } = useApp(),
    [open, setOpen] = useState(false),
    [text, setText] = useState(''),
    [date, setDate] = useState(''),
    [error, setError] = useState('');
  function edit(l: Lesson) {
    setText(JSON.stringify(l, null, 2));
    setDate(l.publishAt ? new Date(new Date(l.publishAt).getTime() + 8 * 3600000).toISOString().slice(0, 16) : '');
    setError('');
    setOpen(true);
  }
  async function publish(status: Lesson['status']) {
    try {
      const l = lessonSchema.parse({
        ...JSON.parse(text),
        status,
        publishAt: status === 'scheduled' ? new Date(date + '+08:00').toISOString() : null
      });
      if (status === 'scheduled' && new Date(l.publishAt!) <= new Date()) throw Error('请选择未来的马来西亚时间');
      const previous = lessons.find(x => x.id === l.id);
      if (state.attempts.some(a => a.lessonId === l.id) && JSON.stringify(previous?.questions) !== JSON.stringify(l.questions)) throw Error('此课程已有测验记录。更改题目请使用新的课程 ID。');
      if (lessons.some(x => x.id !== l.id && x.number === l.number)) throw Error('课程编号已存在');
      if (await save('publish', {
        lesson: l
      }, s => ({
        ...s,
        customLessons: [...s.customLessons.filter(x => x.id !== l.id), l]
      }), demo ? '已保存本地示例课程，未向云端发布。' : '课程已保存')) setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '课程数据格式错误');
    }
  }
  return <><Heading eyebrow="BUILD THE NEXT CHAPTER" title={t("课程管理")} description="管理结构化课程、草稿和发布时间。所有时间均为马来西亚时间。" />{demo && <div className="info-strip"><Info size={18} />本地管理演示：只修改当前浏览器中的课程，不代表真实管理员认证或云端发布。</div>}{!demo && !admin ? <Empty title="仅管理员可访问" description="你的账户没有课程发布权限。" /> : <><div className="toolbar"><p className="muted">{lessons.length} 节课程 · 支持安全的服务器端发布接口</p><Button onClick={() => {
          const n = Math.max(0, ...lessons.map(l => l.number)) + 1;
          edit({
            ...firstLesson,
            id: 'lesson-' + n,
            number: n,
            title: '新课程',
            subtitle: 'New lesson',
            status: 'draft',
            publishAt: null
          });
        }}><Plus size={17} />添加课程</Button></div><div className="card admin-list">{lessons.map(l => <div className="admin-row" key={l.id}><span className="lesson-number">{String(l.number).padStart(2, '0')}</span><div><h3>{l.title}</h3><small>{l.publishAt ? new Date(l.publishAt).toLocaleString('zh-CN', {
                timeZone: 'Asia/Kuala_Lumpur'
              }) : '未设置定时发布'}</small></div><span className="status-chip">{l.status === 'published' ? '已发布' : l.status === 'scheduled' ? '定时发布' : '草稿'}</span><Button variant="outline" onClick={() => edit(l)}>编辑</Button></div>)}</div></>}<Modal open={open} close={() => setOpen(false)} title="编辑结构化课程"><p className="muted">填写词汇、对话、语法和题目，保存前将验证内容结构。</p><textarea className="json-editor" aria-label="课程 JSON" value={text} onChange={e => setText(e.target.value)} /><label className="schedule-input">定时发布时间（Asia/Kuala_Lumpur）<input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} /></label>{error && <p className="error-text" role="alert">{error}</p>}<div className="button-row"><Button variant="outline" disabled={busy} onClick={() => publish('draft')}>保存草稿</Button><Button variant="outline" disabled={busy || !date} onClick={() => publish('scheduled')}><CalendarDays size={16} />定时发布</Button><Button disabled={busy} onClick={() => publish('published')}><Send size={16} />立即发布</Button></div></Modal></>;
}
