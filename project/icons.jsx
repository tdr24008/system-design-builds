// Minimal stroke-style icons for Pulse
const Icon = ({ name, size = 20, color = 'currentColor', strokeWidth = 1.75, style = {} }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  switch (name) {
    case 'home': return (<svg {...p}><path d="M3 11.5L12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>);
    case 'plus': return (<svg {...p}><path d="M12 5v14M5 12h14"/></svg>);
    case 'feed': return (<svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>);
    case 'profile': return (<svg {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>);
    case 'run': return (<svg {...p}><circle cx="15" cy="4.5" r="1.6"/><path d="M7 21l3-5 3 2 2-5 3 3"/><path d="M5 12l3-2 4 1 2 3"/></svg>);
    case 'ride': return (<svg {...p}><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M9 17.5l3-7 4 1 2 6M10 7h3"/></svg>);
    case 'lift': return (<svg {...p}><path d="M3 9v6M21 9v6M6 7v10M18 7v10M6 12h12"/></svg>);
    case 'swim': return (<svg {...p}><path d="M3 10l3-2 3 2 3-2 3 2 3-2 3 2"/><path d="M3 15l3-2 3 2 3-2 3 2 3-2 3 2"/><path d="M3 20l3-2 3 2 3-2 3 2 3-2 3 2"/></svg>);
    case 'other': return (<svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/></svg>);
    case 'chevron-right': return (<svg {...p}><path d="M9 6l6 6-6 6"/></svg>);
    case 'chevron-left': return (<svg {...p}><path d="M15 6l-6 6 6 6"/></svg>);
    case 'check': return (<svg {...p}><path d="M5 12l5 5L20 7"/></svg>);
    case 'heart': return (<svg {...p}><path d="M12 21s-7-4.6-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.4-7 10-7 10z"/></svg>);
    case 'comment': return (<svg {...p}><path d="M21 12a8 8 0 11-3-6.2L21 5l-1 4a8 8 0 011 3z"/></svg>);
    case 'flame': return (<svg {...p}><path d="M12 3s4 4 4 8a4 4 0 11-8 0c0-1.5.8-2.5 1.5-3.2C10 9 9 7.5 9 6.5 9 5 10 4 12 3z"/><path d="M10.5 17a2.5 2.5 0 003 0"/></svg>);
    case 'trend-up': return (<svg {...p}><path d="M4 17l6-6 4 4 6-8"/><path d="M14 7h6v6"/></svg>);
    case 'trend-down': return (<svg {...p}><path d="M4 7l6 6 4-4 6 8"/><path d="M14 17h6v-6"/></svg>);
    case 'arrow-left': return (<svg {...p}><path d="M19 12H5M12 5l-7 7 7 7"/></svg>);
    case 'lock': return (<svg {...p}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>);
    case 'users': return (<svg {...p}><circle cx="9" cy="9" r="3.5"/><path d="M3 19c.8-3 3.4-4.5 6-4.5s5.2 1.5 6 4.5"/><circle cx="17" cy="8" r="2.5"/><path d="M16 14c2.5 0 4.4 1.2 5 4"/></svg>);
    case 'globe': return (<svg {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>);
    case 'refresh': return (<svg {...p}><path d="M3 12a9 9 0 0115-6.7L21 8"/><path d="M21 4v4h-4"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/><path d="M3 20v-4h4"/></svg>);
    case 'settings': return (<svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h0a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v0a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>);
    case 'shield': return (<svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/></svg>);
    case 'watch': return (<svg {...p}><rect x="6" y="6" width="12" height="12" rx="3"/><path d="M9 6V3h6v3M9 18v3h6v-3"/></svg>);
    case 'logout': return (<svg {...p}><path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3"/><path d="M10 17l-5-5 5-5M5 12h12"/></svg>);
    case 'calendar': return (<svg {...p}><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>);
    case 'clock': return (<svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>);
    case 'pin': return (<svg {...p}><path d="M12 21s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>);
    default: return null;
  }
};

window.Icon = Icon;
