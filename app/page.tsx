'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { LayoutDashboard, BookOpen, Library, ChartNoAxesCombined, Settings, ArrowRight, ChevronRight, GraduationCap, Sprout, Menu, Moon, Sun, ShieldCheck, Flower2, Info, X } from 'lucide-react';
import { useJourney } from '@/lib/use-journey';
import { firstLesson, curriculum, type Lesson } from '@/lib/content';
import { lessonUnlocked, type State } from '@/lib/domain';
import { cn } from '@/components/ui/button';
import { JourneyContext, event, type Page } from '@/components/shared';
import Dashboard from '@/components/dashboard';
import { Lessons, Vocabulary, Hiragana } from '@/components/learning';
import Quiz from '@/components/quiz';
import Progress from '@/components/progress';
import { Preferences, Admin } from '@/components/settings';
import KanaPractice from '@/components/kana-practice';
import { Avatar, Loading, PublicPage, Path, Practice, Calendar, Help } from '@/components/expansion';
import { LanguageProvider, LanguageSwitch, useLanguage } from '@/components/language';
import Auth from '@/components/auth';
const nav = [{
  id: 'dashboard',
  name: '学习概览',
  icon: LayoutDashboard
}, {
  id: 'path',
  name: '学习路线',
  icon: BookOpen
}, {
  id: 'daily',
  name: '每日 5 分钟',
  icon: GraduationCap
}, {
  id: 'review',
  name: '错题复习',
  icon: Library
}, {
  id: 'listening',
  name: '听力练习',
  icon: GraduationCap
}, {
  id: 'calendar',
  name: '学习日历',
  icon: ChartNoAxesCombined
}, {
  id: 'help',
  name: '帮助与反馈',
  icon: Info
}, {
  id: 'lessons',
  name: '学习课程',
  icon: BookOpen
}, {
  id: 'vocabulary',
  name: '我的词汇',
  icon: Library
}, {
  id: 'hiragana',
  name: '平假名练习',
  icon: null
}, {
  id: 'katakana',
  name: '片假名练习',
  icon: null
}, {
  id: 'quiz',
  name: '互动测验',
  icon: GraduationCap
}, {
  id: 'progress',
  name: '学习进度',
  icon: ChartNoAxesCombined
}] as const;
export default function App() {
  return <LanguageProvider><Workspace /></LanguageProvider>;
}
function Workspace() {
  const {
    locale,
    setLocale,
    t
  } = useLanguage();
  const reduceMotion = useReducedMotion(),
    j = useJourney(),
    [page, setPage] = useState<Page>('dashboard'),
    [menu, setMenu] = useState(false),
    [notice, notify] = useState(''),
    [reader, setReader] = useState(false),
    [lessonId, setLessonId] = useState('lesson-1');
  const {
    state,
    demo,
    user,
    admin
  } = j;
  const [showLogin, setShowLogin] = useState(false);
  useEffect(() => {
    if (j.loaded && state.locale) setLocale(state.locale);
  }, [j.loaded, state.locale, user?.id]);
  useEffect(() => {
    if (!menu) return;
    const escape=(e:KeyboardEvent)=>{if(e.key==='Escape')setMenu(false)};window.addEventListener('keydown',escape);const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = old;window.removeEventListener('keydown',escape);
    };
  }, [menu]);
  const lessons = useMemo(() => {
    const all = [...curriculum, ...state.customLessons, ...j.courses];
    return [...new Map(all.map(l => [l.id, l])).values()].sort((a,b)=>a.number-b.number);
  }, [state.customLessons, j.courses]);
  const published = lessons.filter(l => l.status === 'published' || l.status === 'scheduled' && l.publishAt && new Date(l.publishAt) <= new Date()),
    lesson = lessons.find(l => l.id === lessonId) ?? firstLesson;
  function go(p: Page) {
    setPage(p);
    setMenu(false);
    setReader(false);
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  }
  async function save(a: string, p: Record<string, unknown>, f: (s: State) => State, msg = t("已保存")) {
    try {
      await j.update(a, p, f);
      if (msg) notify(msg);
      return true;
    } catch (e) {
      notify(e instanceof Error ? e.message : t("保存失败，请重试"));
      return false;
    }
  }
  function startLesson(l: Lesson) {
    if (!lessonUnlocked(state, l.number)) {
      notify('请先完成上一课学习，并在测验中达到 80%');
      return;
    }
    setLessonId(l.id);
    setReader(true);
    setPage('lessons');
    setMenu(false);
    if (!state.lessons[l.id]) {
      const e = event('lesson', '开始学习：' + l.title);
      void save('lesson', {
        id: l.id,
        status: 'started',
        event: e
      }, s => ({
        ...s,
        lessons: {
          ...s.lessons,
          [l.id]: {
            status: 'started'
          }
        },
        events: [...s.events, e]
      }), '');
    }
    window.scrollTo(0, 0);
  }
  const updateRef = useRef(j.update);
  updateRef.current = j.update;
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => notify(''), 5000);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    if ('speechSynthesis' in window) speechSynthesis.getVoices();
  }, []);
  useEffect(() => {
    if (!j.ready || !['lessons', 'vocabulary', 'hiragana', 'katakana', 'quiz', 'daily', 'review', 'listening'].includes(page) || !demo && !user) return;
    let count = 0;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        count++;
        if (count === 30) {
          count = 0;
          const session = {
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            seconds: 30
          };
          updateRef.current('session', session, s => ({
            ...s,
            sessions: [...s.sessions, session]
          })).catch(() => {});
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [page, j.ready, demo, user]);
  if (!j.ready) return <Loading />;
  if (!user && !showLogin && !j.recovery) return <PublicPage login={() => setShowLogin(true)} />;
  if (!user || !user.email_confirmed_at || j.recovery) return <Auth back={() => setShowLogin(false)} recovery={j.recovery} done={() => j.setRecovery(false)} />;
  if (!j.loaded) return j.error ? <div className="auth-shell"><section className="card" role="alert"><h2>读取失败 / Unable to load</h2><p>云端记录仍保留，请检查网络后重试。</p><button onClick={() => j.refresh().catch(e => j.setError(e.message))}>重试 / Retry</button></section></div> : <Loading />;
  return <JourneyContext.Provider value={{
    ...j,
    page,
    go,
    notify,
    save,
    lessons,
    published,
    lesson,
    setLesson: l => setLessonId(l.id),
    reader,
    setReader,
    startLesson
  }}><div className="app-shell"><a className="skip-link" href="#main-content">跳到内容 / Skip to content</a><aside className={cn('sidebar', menu && 'mobile-open')}><a className="brand" href="#" onClick={e => {
          e.preventDefault();
          go('dashboard');
        }}><div className="brand-mark">S</div><div><b>Soriva<span className="brand-dot">.</span></b><small>{t("自由 · 探索")}</small></div></a><div className="nav-caption">LEARN AT YOUR OWN PACE</div><nav aria-label="主导航 / Main navigation">{nav.map(n => <button className={cn('nav-item', page === n.id && 'active')} aria-current={page === n.id ? 'page' : undefined} key={n.id} onClick={() => go(n.id)}>{n.icon ? <n.icon size={19} /> : <span className="kana-icon">あ</span>}<span>{t(n.name)}</span>{n.id === 'lessons' && <span className="nav-count">{String(published.length).padStart(2, '0')}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="little-note"><Sprout size={23} /><p>{t("每天一小步，")}<br />{t("也是向前的旅途。")}</p><small>少しずつ、一歩ずつ。</small></div><button className={cn('nav-item', page === 'settings' && 'active')} onClick={() => go('settings')}><Settings size={19} />{t("偏好设置")}</button>{(demo || admin) && <button className={cn('nav-item', page === 'admin' && 'active')} onClick={() => go('admin')}><ShieldCheck size={19} />{t("课程管理")}{demo && <small>{t("演示")}</small>}</button>}<button className="profile" onClick={() => go('settings')}><span className="avatar"><Avatar value={state.profile?.avatar} /></span><span><b>{state.profile?.name || user.email?.split('@')[0]}</b><small>{t("日语初学者 · Beginner")}</small></span><ChevronRight size={15} /></button></div></aside>{menu && <button className="mobile-backdrop" aria-label={t("关闭菜单")} onClick={() => setMenu(false)} />}<div className="main-shell"><header className="topbar"><div className="breadcrumb"><button className="icon-btn mobile-menu" aria-label={t("打开菜单")} onClick={() => setMenu(true)}><Menu size={20} /></button><span>{t("我的学习空间")}</span><ChevronRight size={13} /><b>{t(nav.find(n => n.id === page)?.name ?? (page === 'settings' ? t("偏好设置") : t("课程管理")))}</b></div><div className="top-actions"><LanguageSwitch onChange={l => void save('locale', {}, s => ({
              ...s,
              locale: l
            }), '')} /><span className="mode-pill"><i />{demo ? t("本地演示模式") : user ? j.busy ? t("正在保存…") : j.error ? t("同步异常") : t("云端账户已连接") : t("登录后云端保存")}</span><button className="icon-btn" aria-label={t("切换明暗主题")} onClick={() => save('preferences', {
              dark: !state.preferences.dark
            }, s => ({
              ...s,
              preferences: {
                ...s.preferences,
                dark: !s.preferences.dark
              }
            }), '')}>{state.preferences.dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="avatar small-avatar" aria-label={t("账户设置")} onClick={() => go('settings')}><Avatar value={state.profile?.avatar} /></button></div></header><main id="main-content">{!state.events.length && <section className="card"><h3>欢迎来到 Soriva · Welcome</h3><p>先学第一课，再练假名。提交成绩后会保存到你的账号。</p><button onClick={() => startLesson(published[0])}>开始第一课 / Start lesson one</button></section>}{j.error && <div className="error-banner" role="alert">{j.error}</div>}{!j.ready ? <div className="skeleton"><div /><div /><div /></div> : <AnimatePresence mode="wait"><motion.div key={user.id + page} initial={reduceMotion ? false : {
              opacity: 0,
              y: 6
            }} animate={{
              opacity: 1,
              y: 0
            }} exit={{
              opacity: 0
            }} transition={{
              duration: reduceMotion ? 0 : .15
            }}>{page === 'path' ? <Path /> : page === 'daily' || page === 'review' || page === 'listening' ? <Practice key={page + user.id} mode={page} /> : page === 'calendar' ? <Calendar /> : page === 'help' ? <Help /> : page === 'dashboard' ? <Dashboard /> : page === 'lessons' ? <Lessons /> : page === 'vocabulary' ? <Vocabulary /> : page === 'hiragana' ? <KanaPractice script="hiragana" /> : page === 'katakana' ? <KanaPractice script="katakana" /> : page === 'quiz' ? <Quiz /> : page === 'progress' ? <Progress /> : page === 'settings' ? <Preferences /> : <Admin />}</motion.div></AnimatePresence>}<footer><span>Soriva <i>·</i> 少しずつ、一歩ずつ。</span><span><Flower2 size={13} />{t("按照自己的节奏，慢慢前行")}</span></footer></main></div>{notice && <div className="toast" role="status"><Info size={18} />{notice}<button aria-label={t("关闭通知")} onClick={() => notify('')}><X size={15} /></button></div>}</div></JourneyContext.Provider>;
}
