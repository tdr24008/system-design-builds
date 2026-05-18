import React from 'react';
import { IOSDevice } from './ios-frame';
import Icon from './icons';
import { T, TabBar } from './ui';
import {
  HomeScreen, LogScreen, DetailScreen, FeedScreen, ProfileScreen,
  toDisplayWorkout,
} from './screens';
import { getWorkouts, getStats, getFeed, createWorkout, DEMO_USER_ID } from './api';
import { enqueue, dequeue, drainQueue } from './db';

export default function App() {
  const [tab, setTab] = React.useState('home');
  const [workouts, setWorkouts] = React.useState([]);
  const [weeklyStats, setWeeklyStats] = React.useState(null);
  const [yearStats, setYearStats] = React.useState(null);
  const [feedItems, setFeedItems] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [screenKey, setScreenKey] = React.useState(0);

  // ── Initial data load ────────────────────────────────────────
  React.useEffect(() => {
    loadWorkouts();
    loadWeeklyStats();
    // Drain any offline queue left from a previous session
    drainQueue(
      (item) => createWorkout(item),
      () => loadWorkouts(),
    );
  }, []);

  React.useEffect(() => {
    if (tab === 'feed' && feedItems === null) loadFeed();
    if (tab === 'profile' && yearStats === null) loadYearStats();
  }, [tab]);

  async function loadWorkouts() {
    try {
      const data = await getWorkouts();
      const sorted = data
        .filter(w => !w.deleted)
        .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
      setWorkouts(sorted.map(toDisplayWorkout));
    } catch {
      // Backend not available — keep empty list, screens show graceful fallback
    }
  }

  async function loadWeeklyStats() {
    try {
      const data = await getStats(DEMO_USER_ID, 'week');
      setWeeklyStats(data);
    } catch {}
  }

  async function loadYearStats() {
    try {
      const data = await getStats(DEMO_USER_ID, 'month');
      setYearStats(data);
    } catch {}
  }

  async function loadFeed() {
    try {
      const data = await getFeed();
      setFeedItems(data.items);
    } catch {}
  }

  // ── Navigation ───────────────────────────────────────────────
  const goTo = (id) => {
    setDetail(null);
    setTab(id);
    setScreenKey(k => k + 1);
  };

  const openWorkout = (w) => {
    setDetail(w);
    setScreenKey(k => k + 1);
  };

  const backFromDetail = () => {
    setDetail(null);
    setScreenKey(k => k + 1);
  };

  // ── Log save: IndexedDB → API → refresh ─────────────────────
  const handleSave = async (newWorkoutData) => {
    // 1. Enqueue immediately so data is safe even if network fails
    await enqueue({ ...newWorkoutData, queued_at: new Date().toISOString() });

    // 2. Show existing "syncing…" toast UI
    setToast({ msg: 'Workout saved · syncing…', state: 'syncing' });

    // 3. Optimistically add to top of list
    const optimistic = {
      id: newWorkoutData.id,
      type: newWorkoutData.type.charAt(0).toUpperCase() + newWorkoutData.type.slice(1),
      title: newWorkoutData.title,
      dateLabel: 'just now',
      primary: newWorkoutData.distance_km ? `${newWorkoutData.distance_km} km` : `${Math.round((new Date(newWorkoutData.ended_at) - new Date(newWorkoutData.started_at)) / 60000)} min`,
      secondary: '—',
      raw: newWorkoutData,
    };
    setWorkouts(prev => [optimistic, ...prev]);
    setTab('home');
    setScreenKey(k => k + 1);

    // 4. POST to API in background
    try {
      await createWorkout(newWorkoutData);
      setToast({ msg: 'Synced', state: 'synced' });
      // Remove from IndexedDB outbox
      await dequeue(newWorkoutData.id);
      // Refresh from server
      await loadWorkouts();
      await loadWeeklyStats();
    } catch {
      setToast({ msg: 'Saved offline · will sync', state: 'offline' });
    }

    setTimeout(() => setToast(null), 2600);
  };

  // ── Render ───────────────────────────────────────────────────
  let content;
  if (detail) {
    content = <DetailScreen workout={detail} onBack={backFromDetail}/>;
  } else if (tab === 'home') {
    content = <HomeScreen workouts={workouts} weeklyStats={weeklyStats} onOpenWorkout={openWorkout}/>;
  } else if (tab === 'log') {
    content = <LogScreen onSave={handleSave}/>;
  } else if (tab === 'feed') {
    content = <FeedScreen feedItems={feedItems}/>;
  } else if (tab === 'profile') {
    content = <ProfileScreen yearStats={yearStats}/>;
  }

  return (
    <IOSDevice width={390} height={844} dark={true}>
      <div style={{
        height: '100%', background: T.bg, color: T.text,
        position: 'relative', display: 'flex', flexDirection: 'column',
      }}>
        {/* Status bar spacer */}
        <div style={{ height: 60, flexShrink: 0 }}/>

        {/* Scrollable content */}
        <div key={screenKey}
          style={{
            flex: 1, overflow: 'auto', overflowX: 'hidden',
            scrollbarWidth: 'none',
            animation: 'screen-in 0.28s ease-out',
          }}>
          {content}
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'absolute', bottom: 110, left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 16px', borderRadius: 999,
            background: toast.state === 'synced' ? 'rgba(34,197,94,0.16)' :
                        toast.state === 'offline' ? 'rgba(59,130,246,0.16)' :
                        'rgba(26,26,30,0.95)',
            border: `1px solid ${
              toast.state === 'synced' ? 'rgba(34,197,94,0.4)' :
              toast.state === 'offline' ? 'rgba(59,130,246,0.4)' :
              T.borderStrong
            }`,
            color: '#fff', fontSize: 13, fontWeight: 600,
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            animation: 'toast-in 0.3s ease-out',
            whiteSpace: 'nowrap',
            zIndex: 40,
          }}>
            {toast.state === 'synced' ? (
              <Icon name="check" size={14} color={T.green} strokeWidth={3}/>
            ) : toast.state === 'offline' ? (
              <Icon name="refresh" size={14} color={T.blue} strokeWidth={2.5}/>
            ) : (
              <div style={{
                width: 12, height: 12, borderRadius: 6,
                border: `2px solid ${T.orange}`, borderTopColor: 'transparent',
                animation: 'spin 0.7s linear infinite',
              }}/>
            )}
            {toast.msg}
          </div>
        )}

        {/* Tab bar */}
        {!detail && <TabBar active={tab} onChange={goTo}/>}
      </div>
    </IOSDevice>
  );
}
