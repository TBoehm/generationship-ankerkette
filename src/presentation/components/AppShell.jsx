// Design reference: CLAUDE.md, Farbwelt und Mobil zuerst
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../domain/constants/routes.js';
import './AppShell.css';

const LINKS = [
  { to: ROUTES.overview, label: 'nav.overview', end: true },
  { to: ROUTES.ship, label: 'nav.ship', end: false },
  { to: ROUTES.flight, label: 'nav.flight', end: false },
];

export default function AppShell({ children }) {
  const { t } = useTranslation();

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <h1 className="app-shell__title">
          {t('app.title')} <span className="app-shell__subtitle">{t('app.subtitle')}</span>
        </h1>
      </header>
      <main className="app-shell__main">{children}</main>
      <nav className="app-shell__nav" aria-label={t('nav.overview')}>
        {LINKS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              isActive ? 'app-shell__link app-shell__link--active' : 'app-shell__link'
            }
          >
            {t(label)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
