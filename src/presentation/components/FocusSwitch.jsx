// Design reference: CLAUDE.md, colour palette and mobile-first rules
import { useTranslation } from 'react-i18next';
import './FocusSwitch.css';

const OPTIONS = ['flight', 'ship'];

export default function FocusSwitch({ focus, onChange }) {
  const { t } = useTranslation();

  return (
    <div className="focus-switch" role="group" aria-label={t('focus.label')}>
      {OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={focus === option}
          className={
            focus === option
              ? 'focus-switch__option focus-switch__option--active'
              : 'focus-switch__option'
          }
          onClick={() => onChange(option)}
        >
          {t(`focus.${option}`)}
        </button>
      ))}
    </div>
  );
}
