import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { games } from './games';

// One-off save/history migrations (e.g. legacy puzzle versions -> numbered versions).
for (const g of games) g.migrate?.();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
