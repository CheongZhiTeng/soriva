import type { State } from './domain';

export function learningDay(at: string | Date, timezone = 'Asia/Kuala_Lumpur') {
  const date = new Date(at);
  if (!Number.isFinite(date.getTime())) return '';
  let formatter: Intl.DateTimeFormat;
  try { formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }); }
  catch { formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }); }
  const parts = formatter.formatToParts(date);
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)?.value).join('-');
}
export function dailyProgress(state: State, now = new Date()) {
  const timezone = state.timezone || 'Asia/Kuala_Lumpur';
  const today = learningDay(now, timezone);
  const goal = [5, 10, 15, 20, 30].includes(state.dailyGoalMinutes ?? 5) ? state.dailyGoalMinutes ?? 5 : 5;
  const active = new Set<string>();
  let seconds = 0;
  const seen = new Set<string>();
  for (const session of state.sessions) {
    if (seen.has(session.id) || !Number.isFinite(session.seconds) || session.seconds <= 0 || new Date(session.at) > now) continue;
    seen.add(session.id);
    const key = learningDay(session.at, timezone);
    if (!key) continue;
    active.add(key);
    if (key === today) seconds += session.seconds;
  }
  for (const run of [...state.attempts, ...state.practiceRuns ?? []]) {
    const key = learningDay(run.at, timezone);
    if (key && run.total > 0 && new Date(run.at) <= now) active.add(key);
  }
  // Count calendar days rather than elapsed 24-hour periods (DST-safe).
  const cursor = new Date(today + 'T12:00:00Z');
  const previous = () => cursor.setUTCDate(cursor.getUTCDate() - 1);
  if (!active.has(today)) previous();
  let streak = 0;
  while (active.has(cursor.toISOString().slice(0, 10))) { streak++; previous(); }
  return { goal, seconds, minutes: Math.floor(seconds / 60), percent: Math.min(100, seconds / (goal * 60) * 100), complete: seconds >= goal * 60, streak, activeToday: active.has(today), timezone };
}
