import assert from 'node:assert/strict';
import {test} from 'node:test';
import {emptyState,mergeStates,parseState,canonical,fingerprint} from '../lib/cloud-state';
test('new accounts have independent empty histories',()=>{const a=emptyState(),b=emptyState();a.lessons.x={status:'completed'};assert.deepEqual(b.lessons,{});assert.equal(b.attempts.length,0)});
test('merge preserves timestamps, all answers, custom data and source unchanged',()=>{const c=emptyState(),l=emptyState();l.events.push({id:'event1',at:'2026-11-01T02:00:00Z',kind:'lesson',label:'完成'});l.attempts.push({id:'a',at:'2026-11-01T02:00:00Z',lessonId:'lesson-1',score:0,total:1,questions:[],answers:{q:['wrong']}});const before=canonical(l);const m=mergeStates(c,l);assert.equal(m.conflicts.length,0);assert.deepEqual(m.state.attempts,l.attempts);assert.equal(canonical(l),before);assert.equal(c.attempts.length,0)});
test('repeated imports do not duplicate records',()=>{const l=emptyState();l.events.push({id:'e',at:'2026-11-01',kind:'lesson',label:'hi'});assert.equal(mergeStates(l,l).state.events.length,1)});
test('conflicting record IDs block merge without overwriting cloud',()=>{const a=emptyState(),b=emptyState();a.vocabulary.x={status:'mastered',favorite:true};b.vocabulary.x={status:'learning',favorite:false};const m=mergeStates(a,b);assert.deepEqual(m.conflicts,['vocabulary: x']);assert.deepEqual(m.state.vocabulary.x,a.vocabulary.x)});
test('malformed backup rejected; unknown original metadata retained',()=>{assert.throws(()=>parseState('{"version":1}'));const raw={...emptyState(),migrationNote:'retain me'};assert.equal((parseState(JSON.stringify(raw)) as any).migrationNote,'retain me')});
test('fingerprint stable and sensitive to source changes',async()=>{assert.equal(await fingerprint('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');assert.notEqual(await fingerprint('abc'),await fingerprint('abcd'))});
test('backup rejects prototype keys at every depth before merging',()=>{
 for(const key of ['__proto__','constructor','prototype']){
  const raw=JSON.stringify(emptyState()).replace('"lessons":{}','"lessons":{"'+key+'":{"status":"started"}}');
  assert.throws(()=>parseState(raw),/Unsafe backup property/);
 }
 assert.equal(({} as Record<string,unknown>).polluted,undefined);
});
test('oversize backups are rejected before parsing',()=>{assert.throws(()=>parseState(' '.repeat(10_000_001)),/exceeds 10 MB/)});
