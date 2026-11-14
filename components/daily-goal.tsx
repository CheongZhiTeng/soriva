'use client';
import { useEffect, useState } from 'react';
import { Flame, Target, CheckCircle2 } from 'lucide-react';
import { useApp } from './shared';
import { useLanguage } from './language';
import { dailyProgress } from '@/lib/daily-goal';

export default function DailyGoal() {
  const { state, save, busy, go } = useApp();
  const { locale } = useLanguage(), en = locale === 'en';
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  const p = dailyProgress(state, now);
  return <section className="card daily-goal-card" aria-labelledby="daily-goal-title">
    <div className="section-head"><h3 id="daily-goal-title"><Target size={18} />{en ? 'Daily goal' : '每日目标'}</h3><span className="goal-streak"><Flame size={18} />{p.streak} {en ? 'day streak' : '天连续学习'}</span></div>
    <div className="goal-summary"><strong>{p.minutes}<small> / {p.goal} {en ? 'min' : '分钟'}</small></strong>{p.complete && <CheckCircle2 aria-label={en ? 'Goal complete' : '目标已完成'} size={24} />}</div>
    <progress className="goal-progress" max={100} value={p.percent} aria-label={en ? 'Daily goal progress' : '每日目标进度'} />
    <p role="status">{p.complete ? (en ? 'Goal complete. Every small step counts!' : '今日目标已完成，每一小步都值得！') : (en ? `${Math.ceil((p.goal * 60 - p.seconds) / 60)} more minutes to reach your goal.` : `再学习 ${Math.ceil((p.goal * 60 - p.seconds) / 60)} 分钟，达成今日目标。`)}</p>
    <label className="goal-setting">{en ? 'Daily target' : '每天学习'}<select value={p.goal} disabled={busy} onChange={e => { const minutes = Number(e.target.value); void save('daily-goal', {}, s => ({ ...s, dailyGoalMinutes: minutes }), en ? 'Daily goal saved' : '每日目标已保存'); }}>{[5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n} {en ? 'minutes' : '分钟'}</option>)}</select></label>
    <p className="goal-note">{en ? 'Focused study time saves every 30 seconds. A study session or submitted practice keeps your streak.' : '专注学习时间每 30 秒保存。学习或提交练习即可延续连续学习记录。'}<br />{p.timezone}</p>
    <button className="text-link" onClick={() => go('daily')}>{en ? 'Start daily practice →' : '开始每日练习 →'}</button>
  </section>;
}
