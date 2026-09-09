// Design reference: CLAUDE.md, colour palette and mobile-first rules
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '../../infrastructure/config/appConfig.js';
import './PendingView.css';

export default function PendingView({ legacyDocument }) {
  const { t } = useTranslation();
  const href = `${APP_CONFIG.basePath}legacy/${legacyDocument}`;

  return (
    <section className="pending">
      <h2 className="pending__title">{t('pending.title')}</h2>
      <p className="pending__body">{t('pending.body')}</p>
      <a className="pending__link" href={href}>
        {t('pending.open')}
      </a>
    </section>
  );
}
