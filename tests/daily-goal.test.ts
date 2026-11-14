import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState } from '../lib/domain';
import { dailyProgress, learningDay } from '../lib/daily-goal';
const now = new Date('2026-11-14T10:00:00Z');
test('defaults to five minutes and ignores duplicate sessions', () => {
  const s = initialState();
  const session = { id: '1', at: now.toISOString(), seconds: 300 };
  s.sessions = [session, session];
  assert.deepEqual([dailyProgress(s, now).goal, dailyProgress(s, now).percent, dailyProgress(s, now).streak], [5, 100, 1]);
});
test('streak remains available until today ends and resets after a missed day', () => {
  const s = initialState(); s.timezone = 'UTC';
  s.sessions = ['12','13'].map(id => ({ id, at: `2026-11-${id}T10:00:00Z`, seconds: 30 }));
  assert.equal(dailyProgress(s, now).streak, 2);
  assert.equal(dailyProgress(s, new Date('2026-11-15T10:00:00Z')).streak, 0);
});
test('counts submitted practice but not settings events toward study streak', () => {
  const s = initialState(); s.events = [{ id: '1', at: now.toISOString(), kind: 'settings', label: 'Saved' }];
  assert.equal(dailyProgress(s, now).streak, 0);
  s.attempts = [{ id: '1', at: now.toISOString(), total: 1, score: 1, lessonId: 'lesson-1', answers: {}, questions: [] }];
  assert.equal(dailyProgress(s, now).streak, 1);
  assert.equal(dailyProgress(s, now).minutes, 0);
});
test('goals use the account timezone and do not count future activity', () => {
  const s = initialState(); s.timezone = 'America/New_York'; s.dailyGoalMinutes = 10;
  assert.equal(learningDay('2026-11-14T01:00:00Z', s.timezone), '2026-11-13');
  s.sessions = [{ id: '1', at: '2026-11-15T10:00:00Z', seconds: 600 }];
  assert.equal(dailyProgress(s, now).percent, 0);
});
test('streak crosses daylight saving boundary using calendar days', () => {
  const s = initialState(); s.timezone = 'America/New_York';
  s.sessions = ['01', '02', '03'].map(id => ({ id, at: `2026-11-${id}T12:00:00Z`, seconds: 30 }));
  assert.equal(dailyProgress(s, new Date('2026-11-03T18:00:00Z')).streak, 3);
});
