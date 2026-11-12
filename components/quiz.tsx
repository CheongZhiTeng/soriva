'use client';

import { useLanguage } from "./language";
import { useRef, useState } from 'react';
import { GraduationCap, ArrowRight, Check, CheckCircle2, Sprout, RotateCcw, ChevronRight } from 'lucide-react';
import { Button, cn } from './ui/button';
import { useApp, Heading, Empty, Modal, event } from './shared';
import { isCorrect, scoreQuiz, lessonUnlocked } from '@/lib/domain';
const types = {
  single: '单项选择',
  multiple: '多项选择',
  boolean: '判断题',
  matching: '日中配对',
  romaji: '罗马音识别',
  recall: '词汇回忆'
};
export default function Quiz() {
  const {
    t
  } = useLanguage();
  const {
      state,
      lesson,
      setLesson,
      published,
      save,
      busy,
      startLesson
    } = useApp(),
    [started, setStarted] = useState(false),
    [index, setIndex] = useState(0),
    [answers, setAnswers] = useState<Record<string, string[]>>({}),
    [checked, setChecked] = useState(false),
    [result, setResult] = useState<{
      score: number;
      total: number;
    } | null>(null),
    [attemptId, setAttemptId] = useState(''),
    [history, setHistory] = useState<string | null>(null);
  const lock = useRef(false),
    q = lesson.questions[index],
    selected = answers[q?.id] ?? [],
    answered = q?.type === 'matching' ? selected.length === q.pairs?.length && selected.every(Boolean) : selected.some(x => x.trim());
  function start() {
    if (!lessonUnlocked(state, lesson.number)) return;
    setStarted(true);
    setIndex(0);
    setAnswers({});
    setChecked(false);
    setResult(null);
    setAttemptId(crypto.randomUUID());
    lock.current = false;
  }
  async function submit() {
    if (lock.current) return;
    lock.current = true;
    const r = scoreQuiz(lesson.questions, answers),
      a = {
        id: attemptId,
        lessonId: lesson.id,
        at: new Date().toISOString(),
        ...r,
        answers,
        questions: lesson.questions
      },
      e = event('quiz', '完成测验：' + lesson.title + ' · ' + r.score + '/' + r.total);
    const ok = await save('quiz', {
      ...a,
      event: e
    }, s => s.attempts.some(x => x.id === a.id) ? s : {
      ...s,
      attempts: [...s.attempts, a],
      events: [...s.events, e]
    }, '成绩已保存，每次尝试都会独立记录。');
    if (ok) {
      setResult(r);
      setStarted(false);
    } else lock.current = false;
  }
  return <><Heading eyebrow="A LITTLE PRACTICE, A LITTLE PROGRESS" title={t("互动测验")} description="在练习中发现进步。每次尝试都会独立保存，你可以放心重来。" />{!started && !result && <div className="quiz-intro-grid"><section className="card quiz-intro"><div className="quiz-symbol"><GraduationCap size={36} /></div><span className="eyebrow">LESSON {String(lesson.number).padStart(2, '0')}</span><h2>{lesson.title}</h2><p>{lesson.questions.length} 道题 · 单项选择 · 每题一个正确答案</p><select aria-label="选择测验课程" value={lesson.id} onChange={e => {
          const l = published.find(l => l.id === e.target.value);
          if (l) setLesson(l);
        }}>{published.map(l => <option disabled={!lessonUnlocked(state, l.number)} key={l.id} value={l.id}>{l.title}</option>)}</select><ul className="objectives"><li><CheckCircle2 size={17} />每题反馈，帮你理解答案</li><li><CheckCircle2 size={17} />提交后保存本次成绩</li><li><CheckCircle2 size={17} />不会自动标记词汇已掌握</li></ul><Button disabled={!lessonUnlocked(state, lesson.number)} onClick={start}>{t("开始测验")}<ArrowRight size={16} /></Button></section><section className="card quiz-note"><Sprout size={35} /><h3>这里没有“失败”</h3><p>每一个错题，都在告诉你下一次该复习什么。</p><p>准备好时再开始，不计时，不催促。</p></section></div>}{started && q && <section className="card quiz-run"><div className="section-head"><span className="eyebrow">QUESTION {index + 1} / {lesson.questions.length}</span><span className="neutral-pill">{types[q.type]}</span></div><div className="progress-track"><i style={{
          width: index / lesson.questions.length * 100 + '%'
        }} /></div><h2>{q.prompt}</h2>{q.type === 'multiple' && <p className="muted">请选择所有正确答案。</p>}{q.type === 'recall' ? <input className="recall-input" aria-label="你的罗马音答案" value={selected[0] ?? ''} disabled={checked} autoComplete="off" placeholder="输入 Romaji…" onChange={e => setAnswers({
        ...answers,
        [q.id]: [e.target.value]
      })} /> : q.type === 'matching' ? <div className="matching-list">{q.pairs?.map((pair, i) => <label key={pair.jp}><b lang="ja">{pair.jp}</b><ArrowRight size={17} /><select aria-label={pair.jp + ' 的中文意思'} disabled={checked} value={selected[i] ?? ''} onChange={e => {
            const a = [...selected];
            a[i] = e.target.value;
            setAnswers({
              ...answers,
              [q.id]: a
            });
          }}><option value="">选择中文含义</option>{q.options?.map(o => <option key={o}>{o}</option>)}</select></label>)}</div> : <div className="quiz-options">{q.options?.map((o, i) => <button key={o} disabled={checked} className={cn('answer-option', selected.includes(o) && 'selected', checked && q.correct.includes(o) && 'correct', checked && selected.includes(o) && !q.correct.includes(o) && 'incorrect')} onClick={() => setAnswers({
          ...answers,
          [q.id]: q.type === 'multiple' ? selected.includes(o) ? selected.filter(x => x !== o) : [...selected, o] : [o]
        })}><span className="option-letter">{String.fromCharCode(65 + i)}</span>{o}{selected.includes(o) && <Check size={17} />}</button>)}</div>}{checked && <div className={cn('feedback', isCorrect(q, selected) ? 'correct' : 'incorrect')}><b>{isCorrect(q, selected) ? '回答正确，做得好！' : '再记住一点点。'}</b><p>{q.explanation}</p></div>}<div className="quiz-actions"><span>最终提交后保存本次记录</span>{!checked ? <Button disabled={!answered} onClick={() => setChecked(true)}>{t("检查答案")}<Check size={16} /></Button> : index < lesson.questions.length - 1 ? <Button onClick={() => {
          setIndex(index + 1);
          setChecked(false);
        }}>{t("下一题")}<ArrowRight size={16} /></Button> : <Button disabled={busy} onClick={submit}>{busy ? t("正在保存…") : t("提交并保存成绩")}<CheckCircle2 size={16} /></Button>}</div></section>}{result && <section className="card result-card"><div className="quiz-symbol"><CheckCircle2 size={38} /></div><span className="eyebrow">一次练习，一点进步</span><h2>{t("测验完成，成绩已保存")}</h2><div className="result-score">{result.score}<span>/ {result.total}</span></div><p>正确率 {Math.round(result.score / result.total * 100)}% · 本次真实作答记录</p><div className="button-row"><Button onClick={start}><RotateCcw size={16} />{t("再试一次")}</Button><Button variant="outline" onClick={() => startLesson(lesson)}>{t("回到课程复习")}</Button></div></section>}<section className="card history-card"><div className="section-head"><h3>{t("我的测验记录")}</h3><span className="neutral-pill">{state.attempts.length} 次尝试</span></div>{!state.attempts.length ? <Empty title="第一份成绩，等你来写" description="还没有提交过测验。完成上方的测验后，成绩会显示在这里。" /> : <div className="history-list">{[...state.attempts].reverse().map(a => <button key={a.id} onClick={() => setHistory(a.id)}><span className="history-icon"><GraduationCap size={19} /></span><span><b>{published.find(l => l.id === a.lessonId)?.title ?? a.lessonId}</b><small>{new Date(a.at).toLocaleString('zh-CN', {
                timeZone: 'Asia/Kuala_Lumpur'
              })}</small></span><strong>{a.score}/{a.total}</strong><ChevronRight size={17} /></button>)}</div>}</section><Modal open={!!history} close={() => setHistory(null)} title="测验作答详情">{(() => {
        const a = state.attempts.find(a => a.id === history);
        return a && <><p>成绩：{a.score} / {a.total}</p>{a.questions.map(q => <div className="attempt-answer" key={q.id}><b>{q.prompt}</b><p>你的答案：{a.answers[q.id]?.join('、')}</p><small>{q.explanation}</small></div>)}</>;
      })()}</Modal></>;
}
