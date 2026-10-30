import { sidekicks } from './sidekicks.js';
import { firebaseConfig, firebaseEmulators } from './firebase-config.js';
import { normalizePin, validateNickname, resolveRound, normalizeAppearance } from './multiplayer-engine.js';

const SDK_VERSION = '13.1.0';
const SDK_ORIGIN = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
let sdkPromise;
const connections = new Map();
const configuredDatabaseEmulators = new Set();
const error = (code, message) => Object.assign(new Error(message), { code: `live/${code}` });
export const avatarIds = sidekicks.map(sidekick => sidekick.id);
const legacyAvatarIds = ['violet', 'peach', 'mint', 'sky', 'rose', 'lemon'];

export function normalizeAvatar(value) {
  let avatar = value;
  if (typeof value === 'string') {
    if (avatarIds.includes(value)) avatar = avatarIds.indexOf(value);
    else if (legacyAvatarIds.includes(value)) avatar = legacyAvatarIds.indexOf(value);
    else avatar = /^(?:0|[1-9][0-9]*)$/.test(value) ? Number(value) : NaN;
  }
  if (!Number.isInteger(avatar) || avatar < 0 || avatar >= avatarIds.length) throw error('invalid-avatar', 'Choose an animal from the list before joining.');
  return avatar;
}

function requirePin(value) {
  const pin = normalizePin(value);
  if (!pin) throw error('invalid-pin', 'Enter the six-digit game PIN.');
  return pin;
}

function roomError(cause) {
  if (cause?.code?.startsWith('live/')) return cause;
  if (/permission.?denied/i.test(`${cause?.code} ${cause?.message}`)) return error('room-unavailable', 'This room is unavailable. Check the PIN or ask the host to create a new game.');
  return cause;
}

const emulatorAddress = (value, fallbackPort) => {
  if (typeof value === 'string') {
    const url = new URL(value.includes('://') ? value : `http://${value}`);
    return { host: url.hostname, port: Number(url.port) || fallbackPort };
  }
  return { host: value?.host || '127.0.0.1', port: Number(value?.port) || fallbackPort };
};

export async function connectRealtime(config = firebaseConfig, emulators = firebaseEmulators) {
  if (!config || !['apiKey', 'projectId', 'databaseURL'].every(field => typeof config[field] === 'string' && config[field].trim())) {
    throw error('not-configured', 'Live play needs a Firebase project with Anonymous Authentication and Realtime Database enabled.');
  }
  const key = JSON.stringify([config.projectId, config.databaseURL, emulators]);
  if (!connections.has(key)) {
    const pending = createService(config, emulators).catch(cause => { connections.delete(key); throw cause; });
    connections.set(key, pending);
  }
  return connections.get(key);
}

async function createService(config, emulators) {
  sdkPromise ||= Promise.all([
    import(`${SDK_ORIGIN}/firebase-app.js`),
    import(`${SDK_ORIGIN}/firebase-auth.js`),
    import(`${SDK_ORIGIN}/firebase-database.js`),
  ]).catch(cause => { sdkPromise = undefined; throw cause; });
  const [appSDK, authSDK, dbSDK] = await sdkPromise;
  let hash = 0;
  for (const char of `${config.projectId}|${config.databaseURL}|${JSON.stringify(emulators)}`) hash = (Math.imul(hash, 31) + char.charCodeAt(0)) | 0;
  const appName = `design-gym-live-${(hash >>> 0).toString(36)}`;
  const app = appSDK.getApps().find(existing => existing.name === appName) || appSDK.initializeApp(config, appName);
  // sessionStorage keeps a tab's anonymous identity on reload while normal tabs stay independent.
  let auth;
  try { auth = authSDK.initializeAuth(app, { persistence: [authSDK.browserSessionPersistence, authSDK.inMemoryPersistence] }); }
  catch (cause) { if (cause.code !== 'auth/already-initialized') throw cause; auth = authSDK.getAuth(app); }
  const database = dbSDK.getDatabase(app);
  if (emulators?.auth && !auth.emulatorConfig) {
    const target = emulatorAddress(emulators.auth, 9099);
    authSDK.connectAuthEmulator(auth, `http://${target.host}:${target.port}`, { disableWarnings: true });
  }
  if (emulators?.database && !configuredDatabaseEmulators.has(appName)) {
    const target = emulatorAddress(emulators.database, 9000);
    dbSDK.connectDatabaseEmulator(database, target.host, target.port);
    configuredDatabaseEmulators.add(appName);
  }
  await auth.authStateReady();
  const user = auth.currentUser || (await authSDK.signInAnonymously(auth)).user;
  const uid = user.uid;
  let offset = 0;
  let connected = false;
  const connectionSubscribers = new Set();
  const roles = new Map();
  const leftRooms = new Set();
  const disconnects = new Map();
  const roomRef = pin => dbSDK.ref(database, `rooms/${requirePin(pin)}`);
  const serverNow = () => Date.now() + offset;
  dbSDK.onValue(dbSDK.ref(database, '.info/serverTimeOffset'), snapshot => { offset = Number(snapshot.val()) || 0; });
  dbSDK.onValue(dbSDK.ref(database, '.info/connected'), snapshot => {
    connected = snapshot.val() === true;
    for (const subscriber of connectionSubscribers) subscriber(connected);
    if (connected) for (const [pin, role] of roles) registerPresence(pin, role).catch(() => {});
  });

  async function getRoom(pin) {
    let snapshot;
    try { snapshot = await dbSDK.get(roomRef(pin)); } catch (cause) { throw roomError(cause); }
    const room = snapshot.val();
    if (!room) throw error('room-not-found', 'No game uses that PIN. Check the six digits and try again.');
    if (room.expiresAt <= serverNow()) throw error('room-expired', 'This game has expired. Ask the host to start a new room.');
    return room;
  }

  async function registerPresence(pin, role) {
    if (roles.get(pin) !== role) return;
    const presence = dbSDK.onDisconnect(dbSDK.ref(database, `rooms/${pin}/${role === 'host' ? 'phase' : `players/${uid}/connected`}`));
    await presence.set(role === 'host' ? 'closed' : false);
    if (roles.get(pin) !== role) { await presence.cancel(); return; }
    disconnects.set(pin, presence);
    if (role === 'player') await dbSDK.set(dbSDK.ref(database, `rooms/${pin}/players/${uid}/connected`), true);
  }

  async function cancelPresence(pin) {
    roles.delete(pin);
    const presence = disconnects.get(pin);
    if (presence) { await presence.cancel(); disconnects.delete(pin); }
  }

  async function hostTransaction(pin, reducer) {
    pin = requirePin(pin);
    await getRoom(pin);
    let failure;
    let result;
    let releaseCache = () => {};
    try {
      // get() may discard its cache after resolving. Hold a stream until the transaction finishes.
      await new Promise((resolve, reject) => {
        releaseCache = dbSDK.onValue(roomRef(pin), () => resolve(), reject);
      });
      result = await dbSDK.runTransaction(roomRef(pin), room => {
        failure = null;
        if (!room) { failure = error('room-not-found', 'This room no longer exists.'); return; }
        if (room.hostId !== uid) { failure = error('host-only', 'Only the host can control this game.'); return; }
        if (room.expiresAt <= serverNow()) { failure = error('room-expired', 'This room has expired. Start a new game.'); return; }
        try { const next = reducer(room); return next === room ? undefined : next; }
        catch (cause) { failure = cause; return; }
      }, { applyLocally: false });
    } catch (cause) { throw roomError(cause); }
    finally { releaseCache(); }
    if (failure) throw failure;
    return result.snapshot.val();
  }

  const service = {
    uid,
    serverNow,
    get connected() { return connected; },
    watchConnection(callback) { connectionSubscribers.add(callback); callback(connected); return () => connectionSubscribers.delete(callback); },
    subscribeConnection(callback) { return this.watchConnection(callback); },

    async createRoom({ questionIds, duration = 30, title = 'Design Gym Live', appearance } = {}) {
      const ids = [...new Set(Array.isArray(questionIds) ? questionIds : [])];
      if (!ids.length || ids.length > 30 || ids.some(id => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(id))) throw error('no-questions', 'Choose between 1 and 30 valid challenges for your game.');
      duration = Number(duration);
      if (!Number.isInteger(duration) || duration < 10 || duration > 120) throw error('invalid-duration', 'Choose a question timer between 10 and 120 seconds.');
      title = typeof title === 'string' ? title.trim().slice(0, 80) : '';
      if (!title) title = 'Design Gym Live';
      appearance = normalizeAppearance(appearance);
      let denied;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const random = globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296 : Math.random();
        const pin = String(100000 + Math.floor(random * 900000));
        let result;
        try {
          result = await dbSDK.runTransaction(roomRef(pin), current => current ? undefined : ({
            hostId: uid, createdAt: dbSDK.serverTimestamp(), expiresAt: Math.floor(serverNow() + 4 * 60 * 60 * 1000),
            phase: 'lobby', questionIds: ids, round: 0, duration, title, startedAt: 0, appearance,
          }), { applyLocally: false });
        } catch (cause) {
          // An expired PIN cannot be read; choose another PIN rather than overwrite it.
          if (/permission.?denied/i.test(`${cause?.code} ${cause?.message}`)) { denied = cause; continue; }
          throw cause;
        }
        if (!result.committed) continue;
        leftRooms.delete(pin);
        roles.set(pin, 'host');
        await registerPresence(pin, 'host');
        return pin;
      }
      if (denied) throw roomError(denied);
      throw error('room-collision', 'A new game PIN could not be reserved. Please try again.');
    },

    async joinRoom(pin, { name, avatar = 0 } = {}) {
      pin = requirePin(pin);
      const nickname = validateNickname(name);
      if (!nickname.valid) throw error('invalid-nickname', nickname.error);
      avatar = normalizeAvatar(avatar);
      const room = await getRoom(pin);
      if (room.hostId === uid) throw error('host-is-not-player', 'You’re hosting this game. Join from another tab or device to play.');
      if (room.phase === 'closed' || room.phase === 'finished') throw error('room-closed', 'This game has ended. Ask the host for a new PIN.');
      if (room.phase !== 'lobby' && !room.players?.[uid]) throw error('game-started', 'This game has already started. Join the next game from its lobby.');
      if (!room.players?.[uid]) {
        try {
          await dbSDK.runTransaction(dbSDK.ref(database, `rooms/${pin}/players/${uid}`), player => player || ({ name: nickname.name, avatar, joinedAt: dbSDK.serverTimestamp(), connected: false }), { applyLocally: false });
        } catch (cause) { throw roomError(cause); }
      }
      leftRooms.delete(pin);
      roles.set(pin, 'player');
      await registerPresence(pin, 'player');
      return pin;
    },

    watchRoom(pin, onChange, onError = () => {}) {
      pin = requirePin(pin);
      return dbSDK.onValue(roomRef(pin), snapshot => {
        const room = snapshot.val();
        if (room && room.phase !== 'finished' && room.phase !== 'closed' && !roles.has(pin) && !leftRooms.has(pin)) {
          const role = room.hostId === uid ? 'host' : room.players?.[uid] ? 'player' : null;
          if (role) { roles.set(pin, role); registerPresence(pin, role).catch(onError); }
        }
        onChange(room);
      }, cause => onError(roomError(cause)));
    },

    async submitAnswer(pin, round, choice) {
      pin = requirePin(pin);
      if (![0, 1].includes(choice) || !Number.isInteger(round)) throw error('invalid-answer', 'Choose one of the two answer options.');
      const room = await getRoom(pin);
      if (!room.players?.[uid] || room.hostId === uid) throw error('player-only', 'Join the game as a player before answering.');
      if (room.phase !== 'question' || room.round !== round || serverNow() > room.startedAt + room.duration * 1000) throw error('answer-window-closed', 'Time is up for this question. Your next chance is coming.');
      if (room.answers?.[round]?.[uid]) throw error('already-answered', 'Your answer is already locked in.');
      let result;
      try { result = await dbSDK.runTransaction(dbSDK.ref(database, `rooms/${pin}/answers/${round}/${uid}`), current => current ? undefined : ({ choice, at: dbSDK.serverTimestamp() }), { applyLocally: false }); }
      catch (cause) {
        if (/permission.?denied/i.test(`${cause?.code} ${cause?.message}`)) throw error('answer-window-closed', 'This round has closed or your answer is already locked in.');
        throw cause;
      }
      if (!result.committed) throw error('already-answered', 'Your answer is already locked in.');
    },

    async startRound(pin, round) {
      return hostTransaction(pin, room => {
        if (!Number.isInteger(round) || round < 0 || round >= room.questionIds.length) throw error('invalid-round', 'This question is not part of the game.');
        if (room.phase === 'question' && room.round === round) return room;
        if (!(room.phase === 'lobby' && round === 0) && !(['reveal', 'leaderboard'].includes(room.phase) && round === room.round + 1)) throw error('invalid-state', 'Reveal this round before starting the next question.');
        return { ...room, phase: 'question', round, startedAt: dbSDK.serverTimestamp() };
      });
    },

    async revealRound(pin, questionsById) {
      return hostTransaction(pin, room => {
        if (['reveal', 'leaderboard', 'finished'].includes(room.phase)) return room;
        if (room.phase !== 'question') throw error('invalid-state', 'Start a question before revealing its answer.');
        const revealed = resolveRound(room, questionsById);
        if (revealed === room) throw error('question-unavailable', 'This question is missing from the local question library.');
        return revealed;
      });
    },

    async showLeaderboard(pin) {
      return hostTransaction(pin, room => {
        if (room.phase === 'leaderboard') return room;
        if (room.phase !== 'reveal') throw error('invalid-state', 'Reveal the answer before showing the leaderboard.');
        return { ...room, phase: 'leaderboard' };
      });
    },

    async finishRoom(pin) {
      const result = await hostTransaction(pin, room => {
        if (room.phase === 'finished') return room;
        if (room.phase === 'closed') throw error('room-closed', 'This game is already closed.');
        return { ...room, phase: 'finished' };
      });
      await cancelPresence(requirePin(pin));
      return result;
    },

    async closeRoom(pin) {
      const result = await hostTransaction(pin, room => room.phase === 'closed' ? room : ({ ...room, phase: 'closed' }));
      await cancelPresence(requirePin(pin));
      return result;
    },

    async leaveRoom(pin) {
      pin = requirePin(pin);
      const room = await getRoom(pin);
      if (room.hostId === uid) return service.closeRoom(pin);
      leftRooms.add(pin);
      await cancelPresence(pin);
      if (!room.players?.[uid]) return;
      if (room.phase === 'lobby') await dbSDK.remove(dbSDK.ref(database, `rooms/${pin}/players/${uid}`));
      else await dbSDK.set(dbSDK.ref(database, `rooms/${pin}/players/${uid}/connected`), false);
    },
  };
  return service;
}
