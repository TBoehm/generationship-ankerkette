// Design reference: CLAUDE.md, Farbwelt und Mobil zuerst
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './presentation/components/AppShell.jsx';
import OverviewPage from './presentation/pages/OverviewPage.jsx';
import ShipPage from './presentation/pages/ShipPage.jsx';
import FlightPage from './presentation/pages/FlightPage.jsx';
import { ROUTES } from './domain/constants/routes.js';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path={ROUTES.overview} element={<OverviewPage />} />
        <Route path={ROUTES.ship} element={<ShipPage />} />
        <Route path={ROUTES.flight} element={<FlightPage />} />
        <Route path="*" element={<Navigate to={ROUTES.overview} replace />} />
      </Routes>
    </AppShell>
  );
}
