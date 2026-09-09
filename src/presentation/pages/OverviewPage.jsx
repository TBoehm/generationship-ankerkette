// Design reference: CLAUDE.md, Farbwelt und Mobil zuerst
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FigureGrid from '../components/FigureGrid.jsx';
import { overviewKeyFigures } from '../../domain/usecases/keyFigures.js';
import { ROUTES } from '../../domain/constants/routes.js';
import './OverviewPage.css';

export default function OverviewPage() {
  const { t } = useTranslation();
  const figures = overviewKeyFigures();

  return (
    <section className="overview">
      <p className="overview__lead">{t('overview.lead')}</p>
      <FigureGrid figures={figures} />
      <div className="overview__links">
        <Link className="overview__link" to={ROUTES.ship}>
          <span className="overview__link-title">{t('nav.ship')}</span>
          <span className="overview__link-text">{t('overview.ship')}</span>
        </Link>
        <Link className="overview__link" to={ROUTES.flight}>
          <span className="overview__link-title">{t('nav.flight')}</span>
          <span className="overview__link-text">{t('overview.flight')}</span>
        </Link>
      </div>
    </section>
  );
}
