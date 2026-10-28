import { act } from 'react';
import { render, screen } from '@testing-library/react';
import io from 'socket.io-client';
import App from './App';

// The real globe needs WebGL (not available in jsdom), so replace it with a
// stub that exposes the data App passes to it.
jest.mock('react-globe.gl', () => ({
  __esModule: true,
  default: ({ arcsData, ringsData, labelsData, arcStartLat, labelText }) => (
    <div
      data-testid="globe"
      data-arcs={arcsData.length}
      data-rings={ringsData.length}
      data-first-arc-lat={arcsData.length ? arcStartLat(arcsData[0]) : ''}
      data-labels={JSON.stringify(labelsData.map(labelText))}
    />
  ),
}));

// Fake socket: records handlers so tests can simulate server events
// without a running backend. Plain functions are used instead of jest.fn()
// because Create React App resets jest.fn() implementations between tests.
jest.mock('socket.io-client', () => {
  const handlers = {};
  const removed = [];
  const socket = {
    on: (event, cb) => { handlers[event] = cb; },
    off: (event) => { removed.push(event); delete handlers[event]; },
  };
  const io = (...args) => {
    io.connectArgs = args;
    return socket;
  };
  io.handlers = handlers;
  io.removed = removed;
  return { __esModule: true, default: io };
});

function emit(event, payload) {
  act(() => io.handlers[event](payload));
}

const sampleAttacks = [
  {
    src: { ip: '1.2.3.4', city: 'Berlin', country: 'DE', lat: 52.5, lng: 13.4, type: 'Port Scan' },
    dst: { name: 'HQ (Seattle)', lat: 47.6, lng: -122.3 },
    magnitude: 20,
  },
  {
    src: { ip: '5.6.7.8', city: 'MAPPED: CN', country: 'CN', lat: 35, lng: 105, type: 'Exploit Attempt' },
    dst: { name: 'HQ (Seattle)', lat: 47.6, lng: -122.3 },
    magnitude: 300,
  },
  {
    src: { ip: '9.9.9.9', city: 'Sydney', country: 'AU', lat: -33.8, lng: 151.2, type: 'Port Scan' },
    dst: { name: 'Server IN (Mumbai)', lat: 19.07, lng: 72.87 },
    magnitude: 5,
  },
];

test('connects to the backend over WebSocket using the default local URL', () => {
  // io() is called once when App.js is first imported.
  expect(io.connectArgs).toEqual([
    'http://127.0.0.1:4000',
    expect.objectContaining({ transports: ['websocket'] }),
  ]);
});

test('renders the HUD and legend before any data arrives', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /cyber war room/i })).toBeInTheDocument();
  expect(screen.getByText(/STATUS: Connecting\.\.\./)).toBeInTheDocument();
  expect(screen.getByText(/ACTIVE VECTORS: 0/)).toBeInTheDocument();
  expect(screen.getByText('LEGEND')).toBeInTheDocument();
  expect(screen.getByText(/HONEYPOT \(Target\)/)).toBeInTheDocument();
  expect(screen.getByText(/ATTACKER \(Source\)/)).toBeInTheDocument();
});

test('shows connected status when the socket connects', () => {
  render(<App />);
  emit('connect');
  expect(screen.getByText('STATUS: CONNECTED: MONITORING')).toBeInTheDocument();
});

test('updates the globe and counters when threat data arrives', () => {
  render(<App />);
  emit('threat-data', sampleAttacks);

  expect(screen.getByText('STATUS: WARNING: THREATS DETECTED')).toBeInTheDocument();
  expect(screen.getByText('ACTIVE VECTORS: 3')).toBeInTheDocument();

  const globe = screen.getByTestId('globe');
  expect(globe).toHaveAttribute('data-arcs', '3');
  expect(globe).toHaveAttribute('data-rings', '3');
  expect(globe).toHaveAttribute('data-first-arc-lat', '52.5');
});

test('labels each attacker and each unique target once', () => {
  render(<App />);
  emit('threat-data', sampleAttacks);

  const labels = JSON.parse(screen.getByTestId('globe').dataset.labels);
  expect(labels).toEqual([
    '[1.2.3.4] BERLIN',
    '[5.6.7.8] MAPPED: CN',
    '[9.9.9.9] SYDNEY',
    '[HQ] HQ (SEATTLE)',
    '[HQ] SERVER IN (MUMBAI)',
  ]);
});

test('removes socket listeners on unmount', () => {
  const { unmount } = render(<App />);
  io.removed.length = 0;
  unmount();
  expect(io.removed).toEqual(expect.arrayContaining(['connect', 'threat-data']));
});
