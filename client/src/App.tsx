// Main App component - CodeMap visualization application
// Provides two views: Tree (force graph) and Hotel (isometric room)
import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { FileGraph } from './components/FileGraph';
import { ActivityLegend } from './components/ActivityLegend';
import { HabboRoom } from './components/HabboRoom';
import { getMuted, setMuted } from './sounds';

// Mute button component
function MuteButton() {
  const [muted, setMutedState] = useState(getMuted());

  const toggle = () => {
    const newState = !muted;
    setMuted(newState);
    setMutedState(newState);
  };

  return (
    <button
      onClick={toggle}
      style={{
        ...navLinkStyle,
        cursor: 'pointer',
        background: muted ? 'rgba(239, 68, 68, 0.9)' : 'rgba(17, 24, 39, 0.9)',
      }}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {muted ? 'Muted' : 'Sound'}
    </button>
  );
}

// TreeView - Shows files as a force-directed graph
function TreeView() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1f2937',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <FileGraph />
      <ActivityLegend />
      <NavLinks />
    </div>
  );
}

// NavLinks - Navigation buttons to switch between Tree and Hotel views
function NavLinks() {
  return (
    <div style={{
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 20,
      display: 'flex',
      gap: 8
    }}>
      <Link to="/" style={navLinkStyle}>Tree</Link>
      <Link to="/hotel" style={navLinkStyle}>Hotel</Link>
      <MuteButton />
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  color: '#e5e7eb',
  textDecoration: 'none',
  padding: '10px 20px',
  backgroundColor: 'rgba(17, 24, 39, 0.95)',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
};

// HotelView - Shows files as desks in an isometric hotel room with animated agents
function HotelView() {
  return (
    <>
      <HabboRoom />
      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 20,
        display: 'flex',
        gap: 8
      }}>
        <Link to="/" style={navLinkStyle}>Tree</Link>
        <Link to="/hotel" style={navLinkStyle}>Hotel</Link>
        <MuteButton />
      </div>
    </>
  );
}

// App - Main routing component
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TreeView />} />
        <Route path="/hotel" element={<HotelView />} />
      </Routes>
    </BrowserRouter>
  );
}
