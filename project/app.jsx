// Pulse — root app with navigation + toast

const INITIAL_WORKOUTS = [
  { id: 'w1', type: 'Run', title: 'Morning loop', dateLabel: 'Today', primary: '8.2 km', secondary: '41 min' },
  { id: 'w2', type: 'Run', title: 'Tempo intervals', dateLabel: 'Yesterday', primary: '6.0 km', secondary: '28 min' },
  { id: 'w3', type: 'Ride', title: 'Long ride', dateLabel: '2 days ago', primary: '42 km', secondary: '1h 38m' },
];

function App() {
  const [tab, setTab] = React.useState('home');
  const [workouts, setWorkouts] = React.useState(INITIAL_WORKOUTS);
  const [detail, setDetail] = React.useState(null);
  const [toast, setToast] = React.useState(null); // { msg, state: 'syncing' | 'synced' }
  const [screenKey, setScreenKey] = React.useState(0);

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

  const handleSave = (newW) => {
    // toast: syncing -> synced
    setToast({ msg: 'Workout saved · syncing…', state: 'syncing' });
    setTimeout(() => setToast({ msg: 'Synced', state: 'synced' }), 1100);
    setTimeout(() => {
      setWorkouts(prev => [newW, ...prev]);
      setTab('home');
      setScreenKey(k => k + 1);
    }, 700);
    setTimeout(() => setToast(null), 2600);
  };

  let content;
  if (detail) {
    content = <DetailScreen workout={detail} onBack={backFromDetail}/>;
  } else if (tab === 'home') {
    content = <HomeScreen workouts={workouts} onOpenWorkout={openWorkout}/>;
  } else if (tab === 'log') {
    content = <LogScreen onSave={handleSave}/>;
  } else if (tab === 'feed') {
    content = <FeedScreen/>;
  } else if (tab === 'profile') {
    content = <ProfileScreen/>;
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
          <style>{`
            div::-webkit-scrollbar { display: none; }
          `}</style>
          {content}
        </div>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'absolute', bottom: 110, left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 16px', borderRadius: 999,
            background: toast.state === 'synced' ? 'rgba(34,197,94,0.16)' : 'rgba(26,26,30,0.95)',
            border: `1px solid ${toast.state === 'synced' ? 'rgba(34,197,94,0.4)' : T.borderStrong}`,
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

// global animations
const styleEl = document.createElement('style');
styleEl.textContent = `
  @keyframes screen-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes toast-in {
    from { opacity: 0; transform: translate(-50%, 8px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse-draw {
    from { stroke-dashoffset: 63; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes pulse-check {
    from { stroke-dashoffset: 20; }
    to { stroke-dashoffset: 0; }
  }
`;
document.head.appendChild(styleEl);

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
