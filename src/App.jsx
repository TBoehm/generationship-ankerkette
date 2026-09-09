// Design reference: CLAUDE.md, colour palette and mobile-first rules
import { Route, Routes } from 'react-router-dom';
import PresentationPage from './presentation/pages/PresentationPage.jsx';
import { ROUTES } from './domain/constants/routes.js';

/**
 * One page for all three paths. The ship and the journey are two focuses of
 * the same view, not two pages, so navigating between them must never unmount
 * the canvas and take the WebGL context with it.
 */
export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.overview} element={<PresentationPage />} />
      <Route path={ROUTES.ship} element={<PresentationPage />} />
      <Route path={ROUTES.flight} element={<PresentationPage />} />
      <Route path="*" element={<PresentationPage />} />
    </Routes>
  );
}
