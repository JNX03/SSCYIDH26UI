export function validateNickname(value) {
  const raw = typeof value === 'string' ? value : '';
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name) return { valid: false, name, error: 'Choose a nickname to join the game.' };
  if (/[\u0000-\u001f\u007f<>]/.test(raw)) return { valid: false, name, error: 'Use a nickname without control characters or angle brackets.' };
  if (name.length > 20) return { valid: false, name, error: 'Keep your nickname to 20 characters or fewer.' };
  return { valid: true, name, error: '' };
}

export function normalizePin(value) {
  const pin = String(value ?? '').replace(/[\s-]/g, '');
  return /^\d{6}$/.test(pin) ? pin : '';
}

export function normalizeAppearance(value) {
  const themes = ['purple', 'midnight', 'coral', 'forest'];
  return { theme: themes.includes(value?.theme) ? value.theme : 'purple', motion: typeof value?.motion === 'boolean' ? value.motion : true };
}

export function shouldEndRound(room) {
  if (room?.phase !== 'question' || !Number.isInteger(room.round) || room.round < 0 || !Number.isFinite(room.startedAt)) return false;
  const durationMs = Number(room.duration) * 1000;
  if (!Number.isFinite(durationMs) || durationMs <= 0) return false;
  const active = Object.entries(room.players || {}).filter(([uid, player]) => uid !== room.hostId && player && player.connected !== false);
  if (active.length === 0) return false;
  return active.every(([uid]) => {
    const answer = room.answers?.[room.round]?.[uid];
    return answer && [0, 1].includes(answer.choice) && Number.isFinite(answer.at) && answer.at >= room.startedAt && answer.at <= room.startedAt + durationMs;
  });
}

export function scoreAnswer(correct, elapsedMs, durationMs) {
  if (correct !== true || !Number.isFinite(durationMs) || durationMs <= 0 || !Number.isFinite(elapsedMs)) return 0;
  const elapsed = Math.min(durationMs, Math.max(0, elapsedMs));
  return Math.round(1000 - 500 * elapsed / durationMs);
}

const nonnegative = value => Number.isFinite(value) && value >= 0 ? value : 0;

export function rankPlayers(room) {
  const players = Object.entries(room?.players || {}).filter(([uid, player]) => uid !== room?.hostId && player && typeof player.name === 'string');
  const ranked = players.map(([uid, player]) => {
    const score = room?.scores?.[uid] || {};
    return { ...player, uid, score: nonnegative(score.score), correct: nonnegative(score.correct), streak: nonnegative(score.streak), lastPoints: nonnegative(score.lastPoints) };
  }).sort((a, b) => b.score - a.score || b.correct - a.correct || a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.uid.localeCompare(b.uid));
  return ranked.map((player, index) => ({ ...player, rank: index && ranked[index - 1].score === player.score ? ranked.findIndex(other => other.score === player.score) + 1 : index + 1 }));
}

export function buildRoomQuestionIds(challenges, topic = 'all', count = 10, random = Math.random) {
  const unique = [...new Map((Array.isArray(challenges) ? challenges : []).filter(question => question && typeof question.id === 'string' && (topic === 'all' || question.topic === topic)).map(question => [question.id, question])).values()];
  const size = Number.isFinite(Number(count)) ? Math.min(30, Math.max(1, Math.trunc(Number(count)))) : 10;
  for (let index = unique.length - 1; index > 0; index -= 1) {
    const value = Math.min(0.999999999, Math.max(0, Number(random()) || 0));
    const other = Math.floor(value * (index + 1));
    [unique[index], unique[other]] = [unique[other], unique[index]];
  }
  return unique.slice(0, size).map(question => question.id);
}

/** Host transaction reducer: moving to reveal prevents this round being scored twice. */
export function resolveRound(room, questionsById) {
  if (!room || room.phase !== 'question') return room;
  const id = room.questionIds?.[room.round];
  const question = questionsById instanceof Map ? questionsById.get(id) : questionsById?.[id];
  if (!question || ![0, 1].includes(question.correct)) return room;
  const durationMs = Number(room.duration) * 1000;
  if (!Number.isFinite(room.startedAt) || !Number.isFinite(durationMs) || durationMs <= 0) return room;
  const scores = { ...(room.scores || {}) };
  for (const uid of Object.keys(room.players || {})) {
    if (uid === room.hostId) continue;
    const previous = scores[uid] || {};
    const answer = room.answers?.[room.round]?.[uid];
    const onTime = answer && Number.isFinite(answer.at) && answer.at >= room.startedAt && answer.at <= room.startedAt + durationMs;
    const correct = Boolean(onTime && answer.choice === question.correct);
    const points = scoreAnswer(correct, onTime ? answer.at - room.startedAt : durationMs, durationMs);
    scores[uid] = {
      score: nonnegative(previous.score) + points,
      correct: nonnegative(previous.correct) + (correct ? 1 : 0),
      streak: correct ? nonnegative(previous.streak) + 1 : 0,
      lastPoints: points,
    };
  }
  return { ...room, phase: 'reveal', scores };
}
