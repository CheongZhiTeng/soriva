'use client';

import { useLanguage } from "./language";
import { useRef, useState } from 'react';
import { allKana } from '@/lib/content';
import { useApp, Heading, event, Speak } from './shared';
import { Button, cn } from './ui/button';
export default function KanaPractice({
  script
}: {
  script: 'hiragana' | 'katakana';
}) {
  const {
    t
  } = useLanguage();
  const {
    state,
    save,
    busy
  } = useApp();
  const list = allKana.map(k => ({
    ...k,
    jp: script === 'katakana' ? String.fromCharCode(k.jp.charCodeAt(0) + 96) : k.jp
  }));
  const [selected, setSelected] = useState<string[]>([]),
    [round, setRound] = useState<string[]>([]),
    [index, setIndex] = useState(0),
    [answer, setAnswer] = useState<string | null>(null);
  const lock = useRef(false),
    k = list.find(x => x.jp === round[index]),
    records = state[script] ?? {},
    title = script === 'hiragana' ? '平假名' : '片假名';
  async function respond(value: string) {
    if (!k || lock.current || answer !== null) return;
    lock.current = true;
    const e = event(script, title + '练习：' + k.jp);
    const ok = await save(script, {
      id: k.jp
    }, s => {
      const map = s[script] ?? {},
        old = map[k.jp] ?? {
          correct: 0,
          total: 0
        };
      return {
        ...s,
        [script]: {
          ...map,
          [k.jp]: {
            correct: old.correct + (value === k.romaji ? 1 : 0),
            total: old.total + 1
          }
        },
        events: [...s.events, e]
      };
    }, '');
    if (ok) setAnswer(value);
    lock.current = false;
  }
  return <><Heading eyebrow="PRACTICE YOUR WAY" title={title + '练习'} description="勾选想练习的假名，可多选。每轮只练习你的选择。" /><section className="card"><div className="button-row"><Button variant="outline" onClick={() => setSelected(list.map(k => k.jp))}>{t("全选")}</Button><Button variant="outline" onClick={() => setSelected([])}>{t("取消选择")}</Button><span>已选 {selected.length} / 46</span></div><div className="kana-select-grid">{list.map(x => <button aria-pressed={selected.includes(x.jp)} className={cn('kana-cell', selected.includes(x.jp) && 'selected')} key={x.jp} onClick={() => setSelected(s => s.includes(x.jp) ? s.filter(v => v !== x.jp) : [...s, x.jp])}><b>{x.jp}</b>{state.preferences.romaji && <small>{x.romaji}</small>}<small>{records[x.jp]?.correct ?? 0}/{records[x.jp]?.total ?? 0}</small></button>)}</div><Button disabled={!selected.length || busy} onClick={() => {
        setRound([...selected].sort(() => Math.random() - .5));
        setIndex(0);
        setAnswer(null);
      }}>{t("开始练习所选假名")}</Button></section>{k && <section className="card kana-practice"><span>本轮 {index + 1} / {round.length}</span><div className="giant-kana">{k.jp}</div><Speak text={k.jp} /><h3>{t("这个假名怎么读？")}</h3><div className="answer-grid">{[k.romaji, ...list.filter(x => x.romaji !== k.romaji).slice(index * 3 % 35, index * 3 % 35 + 3).map(x => x.romaji)].sort().map(r => <button key={r} disabled={busy || answer !== null} className={cn('answer-option', answer === r && (r === k.romaji ? 'correct' : 'incorrect'))} onClick={() => void respond(r)}>{r}</button>)}</div>{answer !== null && <><p className="feedback">{answer === k.romaji ? t("答对了！") : '再记一次：'} {k.jp} → {k.romaji}</p><Button onClick={() => {
          if (index + 1 === round.length) setRound([]);else setIndex(index + 1);
          setAnswer(null);
        }}>{index + 1 === round.length ? t("完成本轮") : t("下一个")}</Button></>}</section>}</>;
}
