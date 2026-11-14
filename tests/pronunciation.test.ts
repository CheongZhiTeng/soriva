import test from 'node:test';
import assert from 'node:assert/strict';
import { selectJapaneseVoice, japaneseVoice } from '../lib/pronunciation';
test('prefers enhanced Japanese voices over the first installed voice', () => {
  const voices = [{ lang: 'en-US', name: 'English Natural', localService: false }, { lang: 'ja-JP', name: 'Basic', localService: true }, { lang: 'ja-JP', name: 'Kyoko Enhanced', localService: true }];
  assert.equal(selectJapaneseVoice(voices)?.name, 'Kyoko Enhanced');
  assert.equal(selectJapaneseVoice(voices.slice(0,1)), undefined);
});
test('waits for asynchronously loaded voices and removes its listener', async () => {
  const target = new EventTarget(); let voices: SpeechSynthesisVoice[] = [];
  const synth = Object.assign(target, { getVoices: () => voices }) as unknown as SpeechSynthesis;
  const result = japaneseVoice(synth);
  voices = [{ lang: 'ja-JP', name: 'Japanese', localService: true } as SpeechSynthesisVoice];
  target.dispatchEvent(new Event('voiceschanged'));
  assert.equal((await result)?.name, 'Japanese');
});
