'use client';

import { useLanguage } from "./language";
import { useState } from 'react';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Clock, CalendarDays, Sprout, Flower2, Check, CheckCircle2, Eye, EyeOff, Search, Star, RotateCcw, Info } from 'lucide-react';
import { Button, cn } from './ui/button';
import { useApp, Heading, Empty, Speak, Modal, event } from './shared';
import { allKana, kanaRows, type Word } from '@/lib/content';
import { labels, stats, lessonUnlocked, type LearningStatus } from '@/lib/domain';
export function Lessons() {
  const {
    t
  } = useLanguage();
  const {
      state,
      lesson,
      published,
      reader,
      setReader,
      go,
      startLesson,
      save,
      busy
    } = useApp(),
    romaji = state.preferences.romaji;
  if (!reader) return <><Heading eyebrow="ONE LESSON AT A TIME" title={t("学习课程")} description="共 11 节入门课程。完成上一课并在测验达到 80%，即可解锁下一课。" /><div className="info-strip"><CalendarDays size={17} />按自己的节奏学习，已解锁课程可随时复习。</div><div className="lesson-grid">{published.map(l => <section className="card lesson-library" key={l.id}><div className="lesson-cover"><span>{String(l.number).padStart(2, '0')}</span><span lang="ja">{l.number === 1 ? 'はじめまして' : '学びの旅'}</span><Flower2 size={45} /></div><div className="lesson-library-body"><div className="section-head"><span className="eyebrow">LESSON {String(l.number).padStart(2, '0')}</span><span className="status-chip">{state.lessons[l.id]?.status === 'completed' ? t("已完成") : state.lessons[l.id] ? t("学习中") : t("未开始")}</span></div><h2>{l.title}</h2><p>{l.subtitle}</p><div className="lesson-meta"><span><Clock size={14} />{l.minutes} 分钟</span><span>{l.words.length} 个词汇</span></div><Button disabled={!lessonUnlocked(state, l.number)} onClick={() => startLesson(l)}>{!lessonUnlocked(state, l.number) ? t("尚未解锁") : state.lessons[l.id] ? t("继续学习") : t("开始学习")}<ArrowRight size={16} /></Button></div></section>)}<section className="upcoming-card"><Sprout size={35} /><h3>新的旅程，慢慢展开</h3><p>下一课尚未发布。<br />先巩固已学内容，让每一步都扎实。</p><Button variant="outline" onClick={() => go('vocabulary')}>复习我的词汇</Button></section></div></>;
  return <><button className="text-link back-link" onClick={() => setReader(false)}><ChevronLeft size={16} />{t("返回课程")}</button><Heading eyebrow={'LESSON ' + String(lesson.number).padStart(2, '0') + ' · ' + lesson.minutes + ' MIN'} title={lesson.title} description={lesson.subtitle} /><div className="reader-toolbar"><span className="status-chip">{state.lessons[lesson.id]?.status === 'completed' ? t("已完成") : t("学习中")}</span><Button variant="ghost" onClick={() => save('preferences', {
        romaji: !romaji
      }, s => ({
        ...s,
        preferences: {
          ...s.preferences,
          romaji: !romaji
        }
      }), '')}>{romaji ? <Eye size={16} /> : <EyeOff size={16} />}罗马音{romaji ? '已显示' : '已隐藏'}</Button></div><div className="reader-layout"><div><section className="card reader-section"><h3>01 <span>{t("这节课，你将学会")}</span></h3><ul className="objectives">{lesson.objectives.map(x => <li key={x}><CheckCircle2 size={17} />{x}</li>)}</ul></section><section className="card reader-section"><h3>02 <span>{t("词汇与实用表达")}</span></h3>{lesson.words.map(w => <div className="reader-word" key={w.id}><div className="section-head"><h4 lang="ja">{w.jp}</h4><Speak text={w.jp} /></div><div className="kana-reading">{w.kana}</div>{romaji && <p className="romaji">{w.romaji}</p>}<b>{w.zh}</b><p className="pronunciation">发音提示 · {w.tip}</p></div>)}</section><section className="card reader-section"><h3>03 <span>{t("一点点语法")}</span></h3><div className="grammar-box"><h2 lang="ja">{lesson.grammar.jp}</h2>{romaji && <p className="romaji">{lesson.grammar.romaji}</p>}<p>{lesson.grammar.zh}</p></div><p>{lesson.grammar.explanation}</p></section><section className="card reader-section"><h3>04 <span>{t("试着聊一聊")}</span></h3>{lesson.dialogue.map((line, i) => <div className={cn('conversation-line', line.speaker === 'B' && 'reply')} key={i}><span className="avatar">{line.speaker}</span><div><b lang="ja">{line.jp}</b><small>{line.kana}</small>{romaji && <p className="romaji">{line.romaji}</p>}<p>{line.zh}</p></div><Speak text={line.jp} /></div>)}</section><section className="card reader-section"><h3>05 <span>{t("把今天的学习留住")}</span></h3><p>{lesson.summary}</p><div className="button-row"><Button onClick={() => go('quiz')}>{t("开始课后测验")}<ArrowRight size={16} /></Button><Button variant="outline" disabled={busy || state.lessons[lesson.id]?.status === 'completed'} onClick={() => {
              const e = event('lesson', '完成课程：' + lesson.title);
              void save('lesson', {
                id: lesson.id,
                status: 'completed',
                event: e
              }, s => ({
                ...s,
                lessons: {
                  ...s.lessons,
                  [lesson.id]: {
                    status: 'completed'
                  }
                },
                events: [...s.events, e]
              }), '已确认完成课程；词汇掌握状态仍由你单独确认。');
            }}>{state.lessons[lesson.id]?.status === 'completed' ? '已确认完成' : t("我已完成本课学习")}</Button></div></section></div><aside className="card reader-aside"><Sprout size={28} /><h3>不必一下学会所有</h3><p>先读一遍，再跟着发音。罗马音会陪你慢慢熟悉平假名。</p><hr /><h4>本课平假名</h4><div className="kana-preview">{['あ', 'い', 'う'].map((k, i) => <button key={k} onClick={() => go('hiragana')}>{k}<small>{['a', 'i', 'u'][i]}</small></button>)}</div><Button variant="outline" onClick={() => go('hiragana')}>去练习平假名</Button></aside></div></>;
}
export function Vocabulary() {
  const {
    t
  } = useLanguage();
  const {
      state,
      published,
      save,
      busy,
      startLesson
    } = useApp(),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [category, setCategory] = useState('all'),
    [flash, setFlash] = useState(false),
    [index, setIndex] = useState(0),
    [flipped, setFlipped] = useState(false);
  const vocabulary = Array.from(new Map(published.flatMap(l => l.words).map(w => [w.id, w])).values()),
    romaji = state.preferences.romaji;
  const visible = vocabulary.filter(w => [w.jp, w.kana, w.romaji, w.zh].join(' ').toLowerCase().includes(search.toLowerCase()) && (category === 'all' || w.category === category) && (filter === 'all' || (filter === 'favorite' ? state.vocabulary[w.id]?.favorite : (state.vocabulary[w.id]?.status ?? 'new') === filter)));
  const word = visible[index % Math.max(1, visible.length)];
  function status(w: Word, s: LearningStatus) {
    const value = {
        status: s,
        favorite: state.vocabulary[w.id]?.favorite ?? false
      },
      e = event('vocabulary', '复习词汇：' + w.jp);
    void save('vocabulary', {
      id: w.id,
      ...value,
      event: e
    }, old => ({
      ...old,
      vocabulary: {
        ...old.vocabulary,
        [w.id]: value
      },
      events: [...old.events, e]
    }));
  }
  function favorite(w: Word) {
    const value = {
      status: state.vocabulary[w.id]?.status ?? 'new' as LearningStatus,
      favorite: !state.vocabulary[w.id]?.favorite
    };
    void save('vocabulary', {
      id: w.id,
      ...value
    }, old => ({
      ...old,
      vocabulary: {
        ...old.vocabulary,
        [w.id]: value
      }
    }), '');
  }
  return <><Heading eyebrow="WORDS THAT STAY WITH YOU" title={t("我的词汇")} description="收藏遇见的表达，把陌生的词变成自己的语言。" /><div className="toolbar"><label className="search"><Search size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索日语、罗马音或中文…" /></label><select aria-label="词汇分类" value={category} onChange={e => setCategory(e.target.value)}><option value="all">全部分类</option>{Array.from(new Set(vocabulary.map(w => w.category))).map(c => <option key={c}>{c}</option>)}</select><Button disabled={!visible.length} onClick={() => {
        setFlash(true);
        setIndex(0);
        setFlipped(false);
      }}><RotateCcw size={16} />{t("闪卡复习")}</Button></div><div className="tabs">{[['all', t("全部词汇")], ['new', t("未学习")], ['learning', t("学习中")], ['mastered', t("已掌握")], ['favorite', t("已收藏")]].map(([key, label]) => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}{key === 'all' && <span>{vocabulary.length}</span>}</button>)}</div><div className="vocab-grid">{visible.map(w => <section className="card vocab-card" key={w.id}><div className="section-head"><span className="neutral-pill">{w.category}</span><div className="inline-actions"><Speak text={w.jp} /><button disabled={busy} className={cn('icon-btn', state.vocabulary[w.id]?.favorite && 'favorited')} aria-label={'收藏 ' + w.jp} aria-pressed={state.vocabulary[w.id]?.favorite ?? false} onClick={() => favorite(w)}><Star size={17} fill={state.vocabulary[w.id]?.favorite ? 'currentColor' : 'none'} /></button></div></div><h2 lang="ja">{w.jp}</h2><div className="kana-reading">{w.kana}</div>{romaji && <p className="romaji">{w.romaji}</p>}<h4>{w.zh}</h4><p className="pronunciation">{w.tip}</p><div className="vocab-footer"><button className="text-link" onClick={() => {
            const l = published.find(l => l.words.some(x => x.id === w.id));
            if (l) startLesson(l);
          }}>第 {published.find(l => l.words.some(x => x.id === w.id))?.number} 课 <ChevronRight size={13} /></button><select aria-label={w.jp + ' 学习状态'} disabled={busy} value={state.vocabulary[w.id]?.status ?? 'new'} onChange={e => status(w, e.target.value as LearningStatus)}>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div></section>)}</div>{!visible.length && <Empty title="还没有符合条件的词汇" description="试试其他关键词，或切换词汇分类。" />}<Modal open={flash} close={() => setFlash(false)} title={'闪卡复习 · ' + (visible.length ? index % visible.length + 1 : 0) + ' / ' + visible.length}>{word ? <><button className="flashcard" aria-label="翻转词卡" onClick={() => setFlipped(!flipped)}><small>{flipped ? '中文释义' : '点击卡片，翻看释义'}</small><h2 lang={flipped ? 'zh' : 'ja'}>{flipped ? word.zh : word.jp}</h2>{!flipped && romaji && <p className="romaji">{word.romaji}</p>}{flipped && <p>{word.tip}</p>}<RotateCcw size={18} /></button><div className="button-row"><Button variant="outline" disabled={busy} onClick={() => status(word, 'learning')}>还需复习</Button><Button disabled={busy} onClick={() => status(word, 'mastered')}><Check size={16} />我已掌握</Button></div><div className="flash-nav"><button className="icon-btn" aria-label="上一张词卡" onClick={() => {
            setIndex((index + visible.length - 1) % visible.length);
            setFlipped(false);
          }}><ChevronLeft /></button><span>主动回忆后，再确认掌握程度</span><button className="icon-btn" aria-label="下一张词卡" onClick={() => {
            setIndex((index + 1) % visible.length);
            setFlipped(false);
          }}><ChevronRight /></button></div></> : <Empty title="当前没有词卡" description="关闭窗口并切换筛选条件。" />}</Modal></>;
}
export function Hiragana() {
  const {
    t
  } = useLanguage();
  const {
      state,
      save,
      busy
    } = useApp(),
    [kana, setKana] = useState('あ'),
    [practice, setPractice] = useState(false),
    [answer, setAnswer] = useState<string | null>(null);
  const k = allKana.find(x => x.jp === kana)!,
    s = stats(state);
  async function respond(a: string) {
    if (answer !== null || busy) return;
    setAnswer(a);
    const correct = a === k.romaji,
      old = state.hiragana[kana] ?? {
        correct: 0,
        total: 0
      },
      e = event('hiragana', '平假名练习：' + kana + ' · ' + (correct ? '正确' : '再复习'));
    const ok = await save('hiragana', {
      id: kana,
      answer: a,
      event: e
    }, state => ({
      ...state,
      hiragana: {
        ...state.hiragana,
        [kana]: {
          correct: old.correct + (correct ? 1 : 0),
          total: old.total + 1
        }
      },
      events: [...state.events, e]
    }), '');
    if (!ok) setAnswer(null);
  }
  return <><Heading eyebrow="MEET THE SOUNDS OF JAPANESE" title={t("平假名练习")} description="从 あ・い・う 开始。无需先掌握全部平假名，也能继续学习课程。" /><div className="info-strip"><Info size={18} />掌握标准：至少答对 3 次，累计正确率达到 80%。只浏览不会计入进度。</div><div className="kana-layout"><section className="card kana-chart"><div className="section-head"><h3>基础五十音</h3><span className="status-chip">{s.kana} / 46 已掌握</span></div><div className="kana-grid">{['a', 'i', 'u', 'e', 'o'].map(x => <span className="column-label" key={x}>{x}</span>)}{kanaRows.flat().map((cell, i) => {
            if (!cell) return <span key={i} />;
            const [jp, r] = cell.split(':'),
              p = state.hiragana[jp];
            return <button key={jp} className={cn('kana-cell', jp === kana && 'selected', p && p.correct >= 3 && p.correct / p.total >= .8 && 'mastered')} onClick={() => {
              setKana(jp);
              setAnswer(null);
            }}><b lang="ja">{jp}</b>{!practice && state.preferences.romaji && <small>{r}</small>}{p && p.total > 0 && <i />}</button>;
          })}</div></section><aside><section className="card kana-detail"><span className="eyebrow">一个假名，一种声音</span><div className="giant-kana" lang="ja">{kana}</div>{!practice && <h2>{k.romaji}</h2>}<Speak text={kana} /><p>{['あ', 'い', 'う'].includes(kana) ? '第一课已介绍 · 继续巩固' : '自由探索 · 随时开始'}</p><div className="kana-score"><span>练习次数 <b>{state.hiragana[kana]?.total ?? 0}</b></span><span>答对次数 <b>{state.hiragana[kana]?.correct ?? 0}</b></span></div><Button onClick={() => {
            setPractice(!practice);
            setAnswer(null);
          }}>{practice ? '返回学习卡' : '开始识别练习'}<ArrowRight size={16} /></Button></section>{practice && <section className="card kana-practice"><h3>「{kana}」怎么读？</h3><div className="answer-grid">{[k.romaji, ...['a', 'i', 'u', 'ka', 'shi'].filter(r => r !== k.romaji).slice(0, 3)].sort().map(r => <button className={cn('answer-option', answer === r && (r === k.romaji ? 'correct' : 'incorrect'))} key={r} disabled={answer !== null || busy} onClick={() => respond(r)}>{r}</button>)}</div>{answer !== null && <><div className={cn('feedback', answer === k.romaji ? 'correct' : 'incorrect')}>{answer === k.romaji ? t("答对了！") : kana + ' 读作 ' + k.romaji + '，再记住一次。'}</div><Button variant="outline" onClick={() => {
              const studied = allKana.filter(x => ['あ', 'い', 'う'].includes(x.jp) || state.hiragana[x.jp]),
                index = studied.findIndex(x => x.jp === kana);
              setKana(studied[(index + 1) % studied.length].jp);
              setAnswer(null);
            }}>下一个假名 <ArrowRight size={16} /></Button></>}</section>}</aside></div></>;
}
