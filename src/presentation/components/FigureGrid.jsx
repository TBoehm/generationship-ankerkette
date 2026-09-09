// Design reference: CLAUDE.md, colour palette and German number formatting
import { useTranslation } from 'react-i18next';
import { formatDecimal, formatInteger } from '../../domain/utils/format.js';
import './FigureGrid.css';

export default function FigureGrid({ figures }) {
  const { t, i18n } = useTranslation();

  return (
    <dl className="figure-grid">
      {figures.map(({ id, value, unit, decimals }) => (
        <div className="figure-grid__cell" key={id}>
          <dt className="figure-grid__key">{t(`figures.${id}`)}</dt>
          <dd className="figure-grid__value">
            {decimals === 0
              ? formatInteger(value, i18n.language)
              : formatDecimal(value, i18n.language, decimals)}
            {unit ? <span className="figure-grid__unit">{t(unit)}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
