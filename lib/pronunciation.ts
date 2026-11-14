export function selectJapaneseVoice<T extends { lang: string; name: string; localService: boolean }>(voices: T[]): T | undefined {
  const quality = (v: T) => (/premium|enhanced|natural|neural/i.test(v.name) ? 100 : 0) + (/google|microsoft|kyoko|otoya|nanami|keita/i.test(v.name) ? 20 : 0) + (!v.localService ? 10 : 0);
  return voices.filter(v => /^ja(?:[-_]|$)/i.test(v.lang)).sort((a, b) => quality(b) - quality(a))[0];
}

export async function japaneseVoice(synth: SpeechSynthesis) {
  const voice = selectJapaneseVoice(synth.getVoices());
  if (voice) return voice;
  // Some browsers populate their voice list only after the first interaction.
  return new Promise<SpeechSynthesisVoice | undefined>(resolve => {
    const finish = () => { clearTimeout(timer); synth.removeEventListener('voiceschanged', changed); resolve(selectJapaneseVoice(synth.getVoices())); };
    const changed = () => { if (selectJapaneseVoice(synth.getVoices())) finish(); };
    const timer = setTimeout(finish, 1500);
    synth.addEventListener('voiceschanged', changed);
    changed();
  });
}
