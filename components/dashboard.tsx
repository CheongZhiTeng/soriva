'use client';

import { useLanguage } from "./language";
import { BookOpen, Library, Target, Clock, CalendarDays, ArrowRight, ArrowUpRight, BookMarked, Sprout, Flower2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { Button } from './ui/button';
import { useApp, Stat, Speak } from './shared';
import Landscape from './landscape';
import { stats, weekActivity } from '@/lib/domain';
import ReminderInbox from './reminder-inbox';
import DailyGoal from './daily-goal';
export default function Dashboard() {
  const {
    t
  } = useLanguage();
  const {
      state,
      user,
      go,
      startLesson,
      published
    } = useApp(),
    s = stats(state),
    activity = weekActivity(state),
    l = published[0];
  const count = new Set(published.flatMap(l => l.words.map(w => w.id))).size;
  return <><div className="page-heading"><div><div className="eyebrow">YOUR LEARNING JOURNEY</div><h1>おかえり，{state.profile?.name || user?.email?.split('@')[0]} <Flower2 size={24} /></h1><p>{t("欢迎回来！今天，也让日语离你更近一点。")}</p></div><span className="date-label"><CalendarDays size={15} />{new Intl.DateTimeFormat('zh-CN', {
          timeZone: 'Asia/Kuala_Lumpur',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        }).format(new Date())}</span></div><section className="hero"><div className="hero-copy"><span className="pill"><i />你的日语之旅，从这里开始</span><h2>{t("自由探索，")}<br />{t("属于你的语言天空。")}</h2><p>不急着精通，先享受每一次进步。<br />让我们从一句「こんにちは」开始。</p><Button onClick={() => l ? startLesson(l) : go('lessons')}>{t("继续学习")}<ArrowRight size={17} /></Button><small><Clock size={13} />第 01 课 · 约 8 分钟</small></div><Landscape /><div className="vertical-japanese">小さな一歩、大きな世界。</div></section><div className="stats-grid"><Stat label={t("已完成课程")} value={String(s.completed).padStart(2, '0')} suffix={'/ ' + String(published.length).padStart(2, '0')} note={s.started + ' 节课程已开始'} icon={<BookOpen />} tone="pink" onClick={() => go('lessons')} /><Stat label={t("已掌握词汇")} value={String(s.mastered).padStart(2, '0')} suffix="个" note={count + ' 个词汇等待探索'} icon={<Library />} tone="green" onClick={() => go('vocabulary')} /><Stat label={t("平假名进度")} value={String(s.kana).padStart(2, '0')} suffix="/ 46" note="从 あ・い・う 开始" icon={<span className="kana-icon">あ</span>} tone="yellow" onClick={() => go('hiragana')} /><Stat label={t("测验正确率")} value={s.accuracy === null ? '—' : String(s.accuracy)} suffix={s.accuracy === null ? '' : '%'} note={s.accuracy === null ? '完成首次测验后解锁' : state.attempts.length + ' 次已提交测验'} icon={<Target />} tone="purple" onClick={() => go('quiz')} /></div><div className="dashboard-columns"><div className="dashboard-left"><section className="card"><div className="section-head"><h3>{t("继续你的学习")}<span className="subtle">Continue learning</span></h3><button className="text-link" onClick={() => go('lessons')}>{t("全部课程")}<ArrowRight size={14} /></button></div><div className="lesson-feature"><div className="lesson-art"><span>あ</span><i>はじめまして</i><Flower2 size={28} /></div><div className="lesson-info"><div className="eyebrow">LESSON 01 <span className="status-chip">{state.lessons['lesson-1']?.status === 'completed' ? t("已完成") : state.lessons['lesson-1'] ? t("学习中") : t("未开始")}</span></div><h3>{t("问候与自我介绍")}</h3><p>Greetings & Self-Introduction</p><div className="lesson-meta"><span><Clock size={13} />8 分钟</span><span><BookMarked size={13} />5 个词汇</span><span>入门 · A0</span></div></div><button className="round-arrow" aria-label="继续第一课" onClick={() => l && startLesson(l)}><ArrowRight size={19} /></button></div><div className="lesson-footer"><span>{state.lessons['lesson-1']?.status === 'completed' ? '已确认完成 · 随时回来复习' : '按自己的节奏，继续这一课'}</span><div className="tiny-track"><i style={{
                width: state.lessons['lesson-1']?.status === 'completed' ? '100%' : '0%'
              }} /></div></div></section><section className="card activity-card"><div className="section-head"><h3>{t("学习的每一小步")}<span className="subtle">Weekly activity</span></h3><span className="neutral-pill">{t("最近 7 天")}</span></div><div className="chart-summary"><strong>{activity.reduce((n, x) => n + x.count, 0)}</strong><span>次学习记录</span><span className="chart-legend"><i />学习活动</span></div><div className="activity-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={activity} barSize={23}><CartesianGrid strokeDasharray="4 5" vertical={false} stroke="var(--line)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{
                  fill: 'var(--muted)',
                  fontSize: 11
                }} dy={8} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{
                  fill: 'var(--muted)',
                  fontSize: 10
                }} width={25} /><Tooltip cursor={{
                  fill: 'var(--soft)'
                }} contentStyle={{
                  background: 'var(--card)',
                  borderRadius: 9,
                  border: '1px solid var(--line)'
                }} formatter={v => [v + ' 次', '学习活动']} /><Bar dataKey="count" fill="#b77c7c" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div>{!state.events.length && <div className="chart-caption">完成一次练习，让今天留下第一笔。</div>}</section></div><div className="dashboard-right"><DailyGoal /><section className="card schedule-card"><h3>{t("我的学习提醒")}</h3><p>{state.reminderConfig?.enabled ? state.reminderConfig.time + ' · ' + state.reminderConfig.timezone : '按自己的节奏，安排下一次学习。'}</p><p>邮件发送服务待配置</p><button className="text-link" onClick={() => go('settings')}>自定义时间与频率 →</button></section><section className="card word-day"><div className="section-head"><h3>{t("复习一词")}<span className="subtle">A little reminder</span></h3><Speak text="こんにちは" /></div><div className="daily-word" lang="ja">こんにちは</div>{state.preferences.romaji && <div className="romaji">Konnichiwa</div>}<p>你好 ／ 午安</p><div className="word-tip">小提示：这里的「は」读作 <b>wa</b>。</div><button className="text-link" onClick={() => go('vocabulary')}>打开我的词汇 <ArrowUpRight size={14} /></button></section></div></div><ReminderInbox /><section className="journey-strip"><div className="sprout-badge"><Sprout /></div><div><h3>{s.completed ? '第一步，已经走出。' : '你的故事，才刚刚开始。'}</h3><p>{s.completed ? '每一次完成都值得记录，继续保持自己的节奏。' : '完成第一课，记录属于你的第一个学习里程碑。'}</p></div><span className="milestone">{s.completed ? <CheckCircle2 size={16} /> : <Flower2 size={16} />}初见日语</span></section></>;
}
