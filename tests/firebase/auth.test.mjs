import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, connectAuthEmulator, signInAnonymously, getIdTokenResult, signOut } from 'firebase/auth';

test('Authentication emulator creates an anonymous player session and signs it out', async () => {
  const endpoint = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099';
  assert.match(endpoint, /^(127\.0\.0\.1|localhost):\d+$/, 'Auth integration tests must use a loopback emulator');
  const app = initializeApp({
    apiKey: 'local-demo-api-key',
    projectId: 'demo-design-gym',
    authDomain: 'demo-design-gym.firebaseapp.com',
  }, `auth-emulator-test-${Date.now()}`);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, `http://${endpoint}`, { disableWarnings: true });
  try {
    const { user } = await signInAnonymously(auth);
    assert.ok(user.uid.length > 0);
    assert.equal(user.isAnonymous, true);
    assert.equal(auth.currentUser.uid, user.uid);
    const token = await getIdTokenResult(user);
    assert.equal(token.claims.aud, 'demo-design-gym');
    assert.equal(token.claims.firebase.sign_in_provider, 'anonymous');
    await signOut(auth);
    assert.equal(auth.currentUser, null);
  } finally {
    await signOut(auth);
    await deleteApp(app);
  }
});
