/**
 * API client — thin fetch wrapper.
 * Injects a fake X-User-Id header for demo auth (no real JWT needed).
 * In production this would be replaced with a proper auth token.
 *
 * The DEMO_USER_ID must match the ID seeded by scripts/seed.py.
 */

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': DEMO_USER_ID,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Types (mirrors backend schemas) ─────────────────────────────────────────

export interface WorkoutOut {
  id: string;
  user_id: string;
  type: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  distance_km: number | null;
  notes: string | null;
  privacy: string;
  client_updated_at: string;
  server_updated_at: string;
  version: number;
  deleted: boolean;
}

export interface DailyBucket {
  date: string;
  distance_km: number;
  duration_min: number;
  workout_count: number;
}

export interface StatsOut {
  period: string;
  workout_count: number;
  total_distance_km: number;
  total_duration_min: number;
  by_type: Record<string, number>;
  daily: DailyBucket[];
}

export interface FeedItemOut {
  id: string;
  user_id: string;
  user_handle: string;
  user_display_name: string;
  user_avatar_hue: number;
  type: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  distance_km: number | null;
  privacy: string;
  kudos_count: number;
  comment_count: number;
  viewer_has_kudos: boolean;
}

export interface FeedOut {
  items: FeedItemOut[];
  next_cursor: string | null;
}

export interface SyncChange {
  id: string;
  type: string;
  title: string;
  started_at: string;
  ended_at?: string | null;
  distance_km?: number | null;
  notes?: string | null;
  privacy: string;
  client_updated_at: string;
  deleted?: boolean;
}

export interface SyncConflict {
  id: string;
  server_record: WorkoutOut;
}

export interface SyncResponse {
  new_cursor: string;
  server_changes: WorkoutOut[];
  conflicts: SyncConflict[];
}

// ── API calls ────────────────────────────────────────────────────────────────

export const getWorkouts = (since?: string) =>
  request<WorkoutOut[]>(`/v1/workouts${since ? `?since=${encodeURIComponent(since)}` : ''}`);

export const createWorkout = (w: Omit<SyncChange, 'deleted'>) =>
  request<WorkoutOut>('/v1/workouts', { method: 'POST', body: JSON.stringify(w) });

export const patchWorkout = (
  id: string,
  patch: { privacy?: string; notes?: string; title?: string; client_updated_at: string },
) =>
  request<WorkoutOut>(`/v1/workouts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });

export const getStats = (userId: string, period: 'week' | 'month') =>
  request<StatsOut>(`/v1/users/${userId}/stats?period=${period}`);

export const getFeed = (cursor?: string) =>
  request<FeedOut>(`/v1/feed${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);

export const toggleKudos = (workoutId: string) =>
  request<{ liked: boolean; count: number }>(`/v1/feed/kudos/${workoutId}`, {
    method: 'POST',
  });

export const sync = (payload: { cursor: string | null; changes: SyncChange[] }) =>
  request<SyncResponse>('/v1/sync', { method: 'POST', body: JSON.stringify(payload) });
