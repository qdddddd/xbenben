// All timestamps and durations are milliseconds. An open final interval is a live pause.
export const isPaused = session => session?.endedAt === null && session.pauses?.at(-1)?.endedAt === null;

export function pausedMs(session, now = Date.now()) {
  const end = session.endedAt ?? now;
  return (session.pauses ?? []).reduce((total, pause) =>
    total + Math.max(0, Math.min(pause.endedAt ?? end, end) - pause.startedAt), 0);
}

export function playingMs(session, now = Date.now()) {
  return Math.max(0, (session.endedAt ?? now) - session.startedAt - pausedMs(session, now));
}

// Clock corrections must not create reversed or overlapping intervals.
const transitionTime = (session, now) => {
  const last = session.pauses?.at(-1);
  return Math.max(now, session.startedAt, last?.endedAt ?? last?.startedAt ?? session.startedAt);
};

export function pauseSession(session, now = Date.now()) {
  if (session.endedAt !== null || isPaused(session)) return session;
  return { ...session, pauses: [...(session.pauses ?? []), { startedAt: transitionTime(session, now), endedAt: null }] };
}

export function resumeSession(session, now = Date.now()) {
  if (!isPaused(session)) return session;
  return { ...session, pauses: [...session.pauses.slice(0, -1), { ...session.pauses.at(-1), endedAt: transitionTime(session, now) }] };
}

export function finishSession(session, now = Date.now()) {
  if (session.endedAt !== null) return session;
  const endedAt = transitionTime(session, now);
  return { ...resumeSession(session, endedAt), endedAt };
}

export function validPauses(session) {
  if (session.pauses === undefined) return true; // Older ledgers and backups were never paused.
  if (!Array.isArray(session.pauses)) return false;
  let previousEnd = session.startedAt;
  return session.pauses.every((pause, index) => {
    if (!pause || !Number.isFinite(pause.startedAt) || pause.startedAt < previousEnd) return false;
    if (pause.endedAt === null) return session.endedAt === null && index === session.pauses.length - 1;
    if (!Number.isFinite(pause.endedAt) || pause.endedAt < pause.startedAt ||
      (session.endedAt !== null && pause.endedAt > session.endedAt)) return false;
    previousEnd = pause.endedAt;
    return true;
  });
}
