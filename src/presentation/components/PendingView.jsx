// Design reference: CLAUDE.md, Farbwelt und Mobil zuerst
import { useTranslation } from 'react-i18next';
import './PendingView.css';

export default function PendingView() {
  const { t } = useTranslation();

  return (
    <section className="pending">
      <h2 className="pending__title">{t('pending.title')}</h2>
      <p className="pending__body">{t('pending.body')}</p>
    </section>
  );
}
