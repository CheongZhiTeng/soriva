'use client';
import { useEffect, useRef, useState } from 'react';
import { japaneseVoice } from './pronunciation';

let playbackRequest = 0;
let activeUtterance: SpeechSynthesisUtterance | null = null;
export function usePronunciation(onError: (message: string) => void) {
  const [playing, setPlaying] = useState(false);
  const mounted = useRef(true), utterance = useRef<SpeechSynthesisUtterance | null>(null);
  useEffect(() => { mounted.current = true; return () => {
    mounted.current = false;
    if (utterance.current && utterance.current === activeUtterance && 'speechSynthesis' in window) { utterance.current.onend = null; utterance.current.onerror = null; window.speechSynthesis.cancel(); }
  }; }, []);
  async function play(text: string, rate = 1, onEnd?: () => void) {
    if (!('speechSynthesis' in window)) { onError('此浏览器不支持语音 / Speech is unavailable in this browser.'); return; }
    const request = ++playbackRequest, synth = window.speechSynthesis;
    synth.cancel();
    setPlaying(true);
    const voice = await japaneseVoice(synth);
    if (!mounted.current || request !== playbackRequest) { if (mounted.current) setPlaying(false); return; }
    if (!voice) { setPlaying(false); onError('请在设备设置中安装日语语音 / Install a Japanese voice in device settings.'); return; }
    const u = new SpeechSynthesisUtterance(text);
    utterance.current = u;
    activeUtterance = u;
    setPlaying(true);
    u.lang = 'ja-JP'; u.voice = voice; u.rate = rate; u.pitch = 1; u.volume = 1;
    u.onend = () => { if (utterance.current !== u) return; if (mounted.current) { setPlaying(false); if (request === playbackRequest) onEnd?.(); } utterance.current = null; };
    u.onerror = e => { if (utterance.current !== u) return; if (mounted.current) { setPlaying(false); if (!['canceled', 'interrupted'].includes(e.error)) onError('播放失败，请重试 / Playback failed. Please try again.'); } utterance.current = null; };
    synth.resume();
    synth.speak(u);
  }
  return { play, playing };
}
