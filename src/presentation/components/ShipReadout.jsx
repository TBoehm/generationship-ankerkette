// Design reference: CLAUDE.md, colour palette and German number formatting
import { useTranslation } from 'react-i18next';
import { overviewKeyFigures } from '../../domain/usecases/keyFigures.js';
import { formatDecimal, formatInteger } from '../../domain/utils/format.js';
import './ShipReadout.css';

const SHOWN = ['length', 'hullDiameter', 'dryMass', 'deckArea', 'crew'];

export default function ShipReadout() {
  const { t, i18n } = useTranslation();
  const figures = overviewKeyFigures().filter((figure) => SHOWN.includes(figure.id));

  return (
    <dl className="ship-readout">
      {figures.map(({ id, value, unit, decimals }) => (
        <div key={id}>
          <dt hidden>{t(`figures.${id}`)}</dt>
          <span>{t(`figures.${id}`)}</span>
          <dd className="ship-readout__value">
            <span className="ship-readout__number">
              {decimals === 0
                ? formatInteger(value, i18n.language)
                : formatDecimal(value, i18n.language, decimals)}
            </span>
            {unit ? <span className="ship-readout__unit"> {t(unit)}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
