import test from 'node:test';
import assert from 'node:assert/strict';
import { connectRealtime } from '../src/realtime.js';

test('live play reports missing Firebase setup before attempting a network connection', async () => {
  await assert.rejects(connectRealtime(null), { code: 'live/not-configured' });
});

test('incomplete Firebase configuration cannot masquerade as a connected game', async () => {
  for (const config of [{}, { projectId: 'demo' }, { projectId: 'demo', apiKey: 'key', databaseURL: '' }]) {
    await assert.rejects(connectRealtime(config), cause => cause.code === 'live/not-configured' && /Anonymous Authentication/.test(cause.message));
  }
});
