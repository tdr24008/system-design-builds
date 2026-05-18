// Screens for Pulse — Home, Log, Detail, Feed, Profile

// ─────────────────────────── HOME ───────────────────────────
const HomeScreen = ({ workouts, onOpenWorkout }) => {
  const weeklyBars = [6.0, 0, 8.5, 5.8, 0, 8.2, 10.1]; // sums ≈ 38.6
  return (
    <div style={{ padding: '0 16px 110px', color: T.text }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0 18px' }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em' }}>Morning, Tom</div>
          <div style={{ fontSize: 13, color: T.textSub, marginTop: 2, fontWeight: 500 }}>Saturday · May 18</div>
        </div>
        <Avatar name="Tom Richardson" size={40} color="oklch(0.5 0.13 240)"/>
      </div>

      {/* Hero stat */}
      <Card padded={false} style={{ padding: 18, marginBottom: 12 }}>
        <Label>This week</Label>
        <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', marginTop: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <Stat value="5" size={32}/>
            <div style={{ fontSize: 11, color: T.textSub, marginTop: 4, fontWeight: 500 }}>workouts</div>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: T.border }}/>
          <div>
            <Stat value="4h 12m" size={32}/>
            <div style={{ fontSize: 11, color: T.textSub, marginTop: 4, fontWeight: 500 }}>moving time</div>
          </div>
          <div style={{ width: 1, alignSelf: 'stretch', background: T.border }}/>
          <div>
            <Stat value="38.6" unit="km" size={32}/>
            <div style={{ fontSize: 11, color: T.textSub, marginTop: 4, fontWeight: 500 }}>distance</div>
          </div>
        </div>
        <WeeklyBars data={weeklyBars} todayIdx={5}/>
      </Card>

      {/* 3 metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <Card padded={false} style={{ padding: 12 }}>
          <Label style={{ fontSize: 10 }}>Distance</Label>
          <Stat value="38.6" unit="km" size={22}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 8, color: T.green, fontSize: 11, fontWeight: 600 }}>
            <Icon name="trend-up" size={12} color={T.green} strokeWidth={2.5}/>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>+12%</span>
            <span style={{ color: T.textMuted, fontWeight: 500 }}>vs last</span>
          </div>
        </Card>
        <Card padded={false} style={{ padding: 12 }}>
          <Label style={{ fontSize: 10 }}>Avg pace</Label>
          <Stat value="5:08" size={22}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 8, color: T.red, fontSize: 11, fontWeight: 600 }}>
            <Icon name="trend-down" size={12} color={T.red} strokeWidth={2.5}/>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>+0:06</span>
            <span style={{ color: T.textMuted, fontWeight: 500 }}>/km</span>
          </div>
        </Card>
        <Card padded={false} style={{ padding: 12 }}>
          <Label style={{ fontSize: 10 }}>Streak</Label>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <Stat value="14" size={22}/>
            <Icon name="flame" size={14} color={T.orange} strokeWidth={2}/>
          </div>
          <div style={{ marginTop: 8, color: T.textMuted, fontSize: 11, fontWeight: 500 }}>days active</div>
        </Card>
      </div>

      {/* Recent workouts */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 4px 8px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Recent workouts</div>
        <div style={{ fontSize: 12, color: T.textSub, fontWeight: 500 }}>See all</div>
      </div>
      <Card padded={false}>
        {workouts.slice(0, 3).map((w, i) => (
          <div key={w.id} onClick={() => onOpenWorkout(w)} style={{
            padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: i < 2 ? `1px solid ${T.border}` : 'none',
            cursor: 'pointer',
          }}>
            <ActivityDisc type={w.type} size={38}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{w.title}</div>
              <div style={{ fontSize: 12, color: T.textSub, marginTop: 2, fontWeight: 500 }}>
                {w.type} · {w.dateLabel}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{w.primary}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{w.secondary}</div>
            </div>
            <Icon name="chevron-right" size={16} color={T.textMuted}/>
          </div>
        ))}
      </Card>

      {/* Goal progress */}
      <div style={{ padding: '18px 4px 8px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Goal progress</div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: T.textSub, fontWeight: 500 }}>Weekly distance goal</div>
          <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: T.orange }}>38.6</span>
            <span style={{ color: T.textSub }}> / 50 km</span>
          </div>
        </div>
        <div style={{
          height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0, width: '77%',
            background: `linear-gradient(90deg, ${T.orange} 0%, #FF8A4F 100%)`,
            borderRadius: 99,
            boxShadow: '0 0 12px rgba(255,90,31,0.4)',
          }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: T.textMuted, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
          <span>77% complete</span>
          <span>11.4 km to go · 2 days left</span>
        </div>
      </Card>
    </div>
  );
};

// ─────────────────────────── LOG ───────────────────────────
const LogScreen = ({ onSave }) => {
  const [type, setType] = React.useState('Run');
  const [date, setDate] = React.useState('Today');
  const [startTime, setStartTime] = React.useState('07:30');
  const [duration, setDuration] = React.useState('42');
  const [distance, setDistance] = React.useState('7.4');
  const [notes, setNotes] = React.useState('');
  const [lifts, setLifts] = React.useState([
    { ex: 'Back squat', sets: 4, reps: 6, weight: '80 kg' },
    { ex: 'Romanian deadlift', sets: 3, reps: 8, weight: '70 kg' },
  ]);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [syncedLabel, setSyncedLabel] = React.useState('syncing…');

  const isCardio = ['Run','Ride','Swim'].includes(type);
  const isLift = type === 'Lift';

  const handleSave = () => {
    if (saving) return;
    setSaving(true);
    setSaved(true);
    setTimeout(() => setSyncedLabel('Synced'), 1100);
    setTimeout(() => {
      // build new workout for home list
      const newW = {
        id: 'w-' + Date.now(),
        type,
        title: type === 'Run' ? 'Evening run' : type === 'Ride' ? 'Quick spin' :
               type === 'Lift' ? 'Strength session' : type === 'Swim' ? 'Pool session' : 'Workout',
        dateLabel: 'just now',
        primary: isCardio ? `${distance} km` : `${duration} min`,
        secondary: isCardio ? `${duration} min` : isLift ? `${lifts.length} exercises` : '—',
      };
      onSave(newW);
    }, 1800);
  };

  return (
    <div style={{ padding: '0 16px 110px', color: T.text, position: 'relative' }}>
      <div style={{ padding: '8px 0 16px' }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em' }}>Log workout</div>
        <div style={{ fontSize: 13, color: T.textSub, marginTop: 2, fontWeight: 500 }}>What did you do today?</div>
      </div>

      {/* Activity selector */}
      <Label style={{ marginBottom: 10 }}>Activity</Label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
        {['Run','Ride','Lift','Swim','Other'].map(t => {
          const on = t === type;
          return (
            <button key={t} onClick={() => setType(t)} style={{
              padding: '8px 14px', borderRadius: 999, border: 'none',
              background: on ? T.orange : 'rgba(255,255,255,0.05)',
              color: on ? '#0E0E10' : T.text,
              border: `1px solid ${on ? T.orange : T.border}`,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              flexShrink: 0, transition: 'all 0.15s',
            }}>
              <Icon name={t === 'Other' ? 'other' : t.toLowerCase()} size={14} color={on ? '#0E0E10' : '#fff'} strokeWidth={2}/>
              {t}
            </button>
          );
        })}
      </div>

      {/* Form */}
      <Card padded={false} style={{ marginBottom: 12 }}>
        <FormRow label="Date" icon="calendar" value={date} onChange={setDate}/>
        <FormRow label="Start time" icon="clock" value={startTime} onChange={setStartTime}/>
        <FormRow label="Duration" icon="clock" value={duration} suffix="min" onChange={setDuration} numeric/>
        {isCardio && (
          <FormRow label="Distance" icon="pin" value={distance} suffix="km" onChange={setDistance} numeric/>
        )}
      </Card>

      {/* Lifts */}
      {isLift && (
        <Card padded={false} style={{ marginBottom: 12, padding: 14 }}>
          <Label style={{ marginBottom: 10 }}>Exercises</Label>
          {lifts.map((l, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 4,
              padding: '10px 0',
              borderBottom: i < lifts.length - 1 ? `1px solid ${T.border}` : 'none',
            }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{l.ex}</div>
              <div style={{ fontSize: 13, color: T.textSub, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                {l.sets} × {l.reps}
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{l.weight}</div>
            </div>
          ))}
          <button style={{
            marginTop: 12, padding: '10px 14px', width: '100%',
            background: 'rgba(255,90,31,0.10)', border: `1px dashed ${T.orangeDim}`,
            color: T.orange, fontWeight: 600, fontSize: 13, borderRadius: 10,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icon name="plus" size={14} color={T.orange} strokeWidth={2.5}/>
            Add exercise
          </button>
        </Card>
      )}

      {/* Notes */}
      <Card style={{ marginBottom: 14 }}>
        <Label style={{ marginBottom: 8 }}>Notes</Label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="How did it feel?"
          style={{
            width: '100%', minHeight: 60, resize: 'none',
            background: 'transparent', border: 'none', outline: 'none',
            color: T.text, fontSize: 14, fontFamily: 'inherit', lineHeight: 1.5,
            padding: 0,
          }}/>
      </Card>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving} style={{
        position: 'sticky', bottom: 86,
        width: '100%', padding: '15px 18px',
        background: saved ? T.green : T.orange,
        border: 'none', borderRadius: 14,
        color: saved ? '#fff' : '#0E0E10', fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em',
        cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.25s',
        boxShadow: saved ? '0 0 0 4px rgba(34,197,94,0.18)' : '0 8px 24px rgba(255,90,31,0.32)',
      }}>
        {saved ? (
          <>
            <SuccessCheck/>
            <span>Workout saved · {syncedLabel}</span>
          </>
        ) : 'Save workout'}
      </button>
    </div>
  );
};

const FormRow = ({ label, icon, value, onChange, suffix, numeric, isLast }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px',
    borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
  }}>
    <Icon name={icon} size={16} color={T.textSub}/>
    <div style={{ fontSize: 13, color: T.textSub, flex: '0 0 90px', fontWeight: 500 }}>{label}</div>
    <input
      value={value} onChange={e => onChange(e.target.value)}
      inputMode={numeric ? 'decimal' : 'text'}
      style={{
        flex: 1, background: 'transparent', border: 'none', outline: 'none',
        color: T.text, fontSize: 14, fontWeight: 600, textAlign: 'right',
        fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
        minWidth: 0,
      }}/>
    {suffix && <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{suffix}</span>}
  </div>
);

const SuccessCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2.5" strokeDasharray="63" strokeDashoffset="0"
            style={{ animation: 'pulse-draw 0.45s ease-out' }}/>
    <path d="M7 12.5l3.5 3.5L17 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray="20" strokeDashoffset="0"
          style={{ animation: 'pulse-check 0.5s ease-out 0.2s both' }}/>
  </svg>
);

// ─────────────────────────── DETAIL ───────────────────────────
const DetailScreen = ({ workout, onBack }) => {
  const [privacy, setPrivacy] = React.useState('Followers');
  const splits = [
    { km: 1, pace: '5:02', rel: 0.7 },
    { km: 2, pace: '4:58', rel: 0.55 },
    { km: 3, pace: '5:14', rel: 0.85 },
    { km: 4, pace: '5:08', rel: 0.75 },
    { km: 5, pace: '4:52', rel: 0.45 },
    { km: 6, pace: '5:01', rel: 0.65 },
    { km: 7, pace: '5:18', rel: 0.92 },
    { km: 8, pace: '4:48', rel: 0.4 },
  ];

  return (
    <div style={{ color: T.text, paddingBottom: 110 }}>
      {/* Map banner with floating back */}
      <div style={{ position: 'relative' }}>
        <RouteBanner height={210}/>
        <button onClick={onBack} style={{
          position: 'absolute', top: 14, left: 14,
          width: 36, height: 36, borderRadius: 18,
          background: 'rgba(14,14,16,0.7)', backdropFilter: 'blur(10px)',
          border: `1px solid ${T.border}`, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="arrow-left" size={18} color="#fff"/>
        </button>
      </div>

      <div style={{ padding: '18px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            padding: '3px 8px', borderRadius: 6,
            background: T.orangeSoft, color: T.orange,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name={(workout.type || 'Run').toLowerCase()} size={11} color={T.orange} strokeWidth={2.5}/>
            {workout.type || 'Run'}
          </div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em' }}>{workout.title}</div>
        <div style={{ fontSize: 13, color: T.textSub, marginTop: 2, fontWeight: 500 }}>
          {workout.dateLabel} · 07:14 AM
        </div>

        {/* Stat grid (5 tiles) */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8, marginTop: 18,
        }}>
          <StatTile label="Distance" value="8.2" unit="km"/>
          <StatTile label="Duration" value="41:08"/>
          <StatTile label="Avg pace" value="5:02" unit="/km"/>
          <StatTile label="Avg HR" value="156" unit="bpm"/>
          <StatTile label="Elevation" value="84" unit="m"/>
          <StatTile label="Calories" value="612" unit="kcal" muted/>
        </div>

        {/* HR chart */}
        <div style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <Label>Heart rate</Label>
            <div style={{ fontSize: 11, color: T.textSub, fontWeight: 500 }}>
              <span style={{ color: T.orange, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>178</span> max · <span style={{ fontVariantNumeric: 'tabular-nums' }}>156</span> avg
            </div>
          </div>
          <Card padded={false} style={{ padding: 14 }}>
            <HRChart/>
          </Card>
        </div>

        {/* Splits */}
        <div style={{ marginTop: 18 }}>
          <Label style={{ marginBottom: 8 }}>Splits</Label>
          <Card padded={false}>
            <div style={{
              display: 'grid', gridTemplateColumns: '24px 1fr 60px',
              padding: '10px 14px', borderBottom: `1px solid ${T.border}`,
              fontSize: 10, color: T.textMuted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <span>KM</span><span style={{ paddingLeft: 8 }}>Pace</span><span style={{ textAlign: 'right' }}>Min/km</span>
            </div>
            {splits.map((s, i) => (
              <div key={s.km} style={{
                display: 'grid', gridTemplateColumns: '24px 1fr 60px', alignItems: 'center',
                padding: '10px 14px', gap: 10,
                borderBottom: i < splits.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <span style={{ fontSize: 12, color: T.textSub, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{s.km}</span>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', inset: 0, width: `${s.rel * 100}%`,
                    background: `oklch(${0.7 - s.rel * 0.18} 0.16 ${50 - s.rel * 15})`,
                    borderRadius: 4,
                  }}/>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.pace}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Privacy */}
        <div style={{ marginTop: 18 }}>
          <Label style={{ marginBottom: 8 }}>Who can see this</Label>
          <Card>
            <Segmented options={[
              { value: 'Private', label: 'Private' },
              { value: 'Followers', label: 'Followers' },
              { value: 'Public', label: 'Public' },
            ]} value={privacy} onChange={setPrivacy}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: T.textSub, fontSize: 12 }}>
              <Icon name={privacy === 'Private' ? 'lock' : privacy === 'Followers' ? 'users' : 'globe'} size={14} color={T.textSub}/>
              <span style={{ fontWeight: 500 }}>
                {privacy === 'Private' && 'Only you can see this workout.'}
                {privacy === 'Followers' && 'Visible to your 204 followers.'}
                {privacy === 'Public' && 'Visible to everyone on Pulse.'}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatTile = ({ label, value, unit, muted }) => (
  <Card padded={false} style={{ padding: 12, opacity: muted ? 0.7 : 1 }}>
    <Label style={{ fontSize: 9.5 }}>{label}</Label>
    <div style={{ marginTop: 6 }}>
      <Stat value={value} unit={unit} size={20}/>
    </div>
  </Card>
);

// ─────────────────────────── FEED ───────────────────────────
const FeedScreen = () => {
  const [tab, setTab] = React.useState('Following');
  const [pulled, setPulled] = React.useState(false);
  const [liked, setLiked] = React.useState({});

  const items = [
    { id: 1, user: '@sarah_runs', name: 'Sarah Chen', avatarHue: 320, type: 'Run', title: 'Park 10K — easy long', when: '2h ago',
      stats: ['10.0 km', '52:14', '5:13 /km'], kudos: 24, comments: 4, route: 1, likedInit: true },
    { id: 2, user: '@mike.cycles', name: 'Mike Tanaka', avatarHue: 200, type: 'Ride', title: 'Hill repeats on Skyline', when: '4h ago',
      stats: ['31.0 km', '1:12:08', '28.4 km/h'], kudos: 12, comments: 2, route: 2 },
    { id: 3, user: '@ana.lifts', name: 'Ana Marín', avatarHue: 30, type: 'Lift', title: 'Leg day — squat PR', when: 'Yesterday',
      stats: ['5 exercises', '48 min', '14 sets'], kudos: 8, comments: 1, route: 0 },
    { id: 4, user: '@dan_tri', name: 'Dan Park', avatarHue: 160, type: 'Swim', title: 'Pool 2k — endurance', when: 'Yesterday',
      stats: ['2.0 km', '39:42', '1:59 /100m'], kudos: 15, comments: 0, route: 0 },
    { id: 5, user: '@sarah_runs', name: 'Sarah Chen', avatarHue: 320, type: 'Run', title: 'Tempo intervals', when: '2 days ago',
      stats: ['6.4 km', '28:09', '4:24 /km'], kudos: 31, comments: 6, route: 3 },
  ];

  const toggleLike = (id) => setLiked(s => ({ ...s, [id]: !s[id] }));

  return (
    <div style={{ color: T.text, padding: '0 16px 110px', position: 'relative' }}>
      {/* Pull to refresh indicator */}
      <div style={{
        position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
        width: 36, height: 36, borderRadius: 18,
        background: T.card, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0.6,
      }}>
        <Icon name="refresh" size={16} color={T.textSub} style={{ transform: 'rotate(-30deg)' }}/>
      </div>

      <div style={{ padding: '8px 0 14px' }}>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 14 }}>Feed</div>
        <Segmented options={['Following','Discover']} value={tab} onChange={setTab}/>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(it => {
          const isLiked = it.likedInit ? !liked[it.id] : !!liked[it.id]; // toggle from default
          const initiallyLiked = it.likedInit;
          const showLikedState = initiallyLiked ? !liked[it.id] : !!liked[it.id];
          const count = it.kudos + ((showLikedState && !initiallyLiked) ? 1 : 0) + ((initiallyLiked && !showLikedState) ? -1 : 0);
          return (
            <Card key={it.id} padded={false} style={{ padding: 14 }}>
              {/* header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Avatar name={it.name} size={36} color={`oklch(0.5 0.13 ${it.avatarHue})`}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em' }}>{it.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1, fontWeight: 500 }}>{it.user} · {it.when}</div>
                </div>
                <ActivityDisc type={it.type} size={28}/>
              </div>

              {/* title */}
              <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 12 }}>{it.title}</div>

              {/* body grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 96px', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                  {it.stats.map((s, i) => {
                    const [num, ...rest] = s.split(' ');
                    return (
                      <div key={i}>
                        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>{num}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{rest.join(' ')}</div>
                      </div>
                    );
                  })}
                </div>
                {it.route > 0 ? (
                  <MiniRoute width={96} height={56} seed={it.route}/>
                ) : (
                  <div style={{
                    width: 96, height: 56, borderRadius: 8,
                    background: '#0A0A0C',
                    border: `1px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: T.textMuted, fontSize: 10, fontWeight: 500, letterSpacing: '0.04em',
                  }}>No route</div>
                )}
              </div>

              {/* footer */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, marginTop: 14, paddingTop: 12,
                borderTop: `1px solid ${T.border}`,
              }}>
                <button onClick={() => toggleLike(it.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: showLikedState ? T.orange : T.textSub,
                  fontFamily: 'inherit',
                }}>
                  <Icon name="heart" size={16} color={showLikedState ? T.orange : T.textSub} strokeWidth={2}
                        style={{ fill: showLikedState ? T.orange : 'none' }}/>
                  <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textSub }}>
                  <Icon name="comment" size={16} color={T.textSub}/>
                  <span style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{it.comments}</span>
                </div>
                <div style={{ flex: 1 }}/>
                <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>Give kudos</div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────── PROFILE ───────────────────────────
const ProfileScreen = () => {
  // 12-week heatmap = 12 * 7 = 84 cells
  const cells = React.useMemo(() => {
    const out = [];
    for (let i = 0; i < 84; i++) {
      const r = Math.sin(i * 2.7) * 0.5 + 0.5;
      const r2 = Math.sin(i * 0.7) * 0.5 + 0.5;
      let v = 0;
      if (r > 0.7) v = 3;
      else if (r > 0.5) v = 2;
      else if (r2 > 0.5) v = 1;
      out.push(v);
    }
    // Force last few to be filled (recent activity)
    [83, 81, 78, 75, 72].forEach(i => out[i] = Math.max(out[i], 2));
    return out;
  }, []);

  const records = [
    { label: '5K', value: '21:48', date: 'Apr 12', icon: 'run' },
    { label: '10K', value: '45:32', date: 'Mar 02', icon: 'run' },
    { label: 'Longest ride', value: '84 km', date: 'Feb 24', icon: 'ride' },
    { label: 'Heaviest lift', value: '120 kg', date: 'May 04', icon: 'lift' },
  ];

  const settings = [
    { label: 'Account', icon: 'profile' },
    { label: 'Privacy', icon: 'shield' },
    { label: 'Connected devices', icon: 'watch' },
    { label: 'Sign out', icon: 'logout', danger: true },
  ];

  return (
    <div style={{ color: T.text, padding: '0 16px 110px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0 18px' }}>
        <Avatar name="Tom Richardson" size={64} color="oklch(0.5 0.13 240)"/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>Tom Richardson</div>
          <div style={{ fontSize: 13, color: T.textSub, fontWeight: 500 }}>@tomr</div>
          <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12, fontWeight: 500 }}>
            <span><strong style={{ color: T.text, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>182</strong>{' '}<span style={{ color: T.textSub }}>Following</span></span>
            <span><strong style={{ color: T.text, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>204</strong>{' '}<span style={{ color: T.textSub }}>Followers</span></span>
          </div>
        </div>
        <Icon name="settings" size={20} color={T.textSub}/>
      </div>

      {/* This year stats */}
      <Card padded={false} style={{ padding: 14, marginBottom: 12 }}>
        <Label style={{ marginBottom: 12 }}>This year · 2026</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          <div>
            <Stat value="108" size={24}/>
            <div style={{ fontSize: 11, color: T.textSub, marginTop: 4, fontWeight: 500 }}>workouts</div>
          </div>
          <div>
            <Stat value="742" unit="km" size={24}/>
            <div style={{ fontSize: 11, color: T.textSub, marginTop: 4, fontWeight: 500 }}>distance</div>
          </div>
          <div>
            <Stat value="78h" size={24}/>
            <div style={{ fontSize: 11, color: T.textSub, marginTop: 4, fontWeight: 500 }}>moving time</div>
          </div>
        </div>
      </Card>

      {/* Heatmap */}
      <Card padded={false} style={{ padding: 14, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <Label>Activity · last 12 weeks</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: T.textMuted, fontWeight: 500 }}>
            <span>Less</span>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: 2,
                background: i === 0 ? 'rgba(255,255,255,0.06)' : `rgba(255,90,31,${0.25 + i * 0.25})`,
              }}/>
            ))}
            <span>More</span>
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridAutoRows: '1fr',
          gap: 3,
        }}>
          {Array.from({ length: 7 }).map((_, row) => (
            Array.from({ length: 12 }).map((_, col) => {
              const idx = col * 7 + row;
              const v = cells[idx];
              return (
                <div key={`${row}-${col}`} style={{
                  aspectRatio: '1',
                  borderRadius: 2,
                  background: v === 0 ? 'rgba(255,255,255,0.05)' : `rgba(255,90,31,${0.25 + v * 0.25})`,
                  gridRow: row + 1, gridColumn: col + 1,
                }}/>
              );
            })
          ))}
        </div>
      </Card>

      {/* Personal records */}
      <div style={{ padding: '8px 4px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Personal records</div>
      <Card padded={false}>
        {records.map((r, i) => (
          <div key={r.label} style={{
            padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: i < records.length - 1 ? `1px solid ${T.border}` : 'none',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: T.orangeSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon name={r.icon} size={16} color={T.orange} strokeWidth={2}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: T.textSub, fontWeight: 500 }}>{r.label}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{r.value}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, fontWeight: 500 }}>{r.date}</div>
            </div>
          </div>
        ))}
      </Card>

      {/* Settings */}
      <div style={{ padding: '18px 4px 8px', fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Settings</div>
      <Card padded={false}>
        {settings.map((s, i) => (
          <div key={s.label} style={{
            padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: i < settings.length - 1 ? `1px solid ${T.border}` : 'none',
            cursor: 'pointer',
          }}>
            <Icon name={s.icon} size={18} color={s.danger ? T.red : T.textSub} strokeWidth={1.75}/>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: s.danger ? T.red : T.text }}>{s.label}</div>
            {!s.danger && <Icon name="chevron-right" size={14} color={T.textMuted}/>}
          </div>
        ))}
      </Card>

      <div style={{ textAlign: 'center', marginTop: 22, fontSize: 11, color: T.textMuted, letterSpacing: '0.04em', fontWeight: 500 }}>
        PULSE · v2.4.1
      </div>
    </div>
  );
};

Object.assign(window, { HomeScreen, LogScreen, DetailScreen, FeedScreen, ProfileScreen });
