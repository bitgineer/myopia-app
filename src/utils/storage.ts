// Progress tracking utilities

const STORAGE_KEY = 'myopiaAppProgress_v2';

export interface Session {
  startTime: number;
  speed: number;
  pattern: string;
  durationMs: number;
}

export function getHistory(): Session[] {
  const history = localStorage.getItem(STORAGE_KEY);
  return history ? JSON.parse(history) : [];
}

export function saveHistory(history: Session[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function addSession(session: Session): void {
  if (session.durationMs > 100) {
    const history = getHistory();
    history.push(session);
    saveHistory(history);
  }
}

export function getLastDuration(): number {
  const history = getHistory();
  if (history.length > 0) {
    history.sort((a, b) => b.startTime - a.startTime);
    return history[0].durationMs;
  }
  return 0;
}

export function getTotalStats(): { totalSessions: number; totalDurationMs: number } {
  const history = getHistory();
  const totalDurationMs = history.reduce((sum, session) => sum + session.durationMs, 0);
  return {
    totalSessions: history.length,
    totalDurationMs
  };
}
