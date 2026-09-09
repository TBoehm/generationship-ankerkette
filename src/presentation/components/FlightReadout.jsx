// Design reference: CLAUDE.md, colour palette and German number formatting
import { useTranslation } from 'react-i18next';
import { formatDecimal, formatInteger } from '../../domain/utils/format.js';
import './FlightReadout.css';

export default function FlightReadout({ readout }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const entries = [
    { id: 'time', value: `${formatDecimal(readout.missionYears, lang, 1)} ${t('units.year')}` },
    {
      id: 'speed',
      value: `${formatInteger(readout.speedKmS, lang)} ${t('units.kilometrePerSecond')}`,
    },
    {
      id: 'sun',
      value: `${formatInteger(readout.distanceFromSunAu, lang)} ${t('units.astronomicalUnit')}`,
    },
    {
      id: 'target',
      value: `${formatInteger(readout.distanceToTargetAu, lang)} ${t('units.astronomicalUnit')}`,
    },
    { id: 'generation', value: formatInteger(readout.generation, lang) },
    { id: 'phase', value: t(`phase.${readout.phase}`) },
  ];

  return (
    <dl className="flight-readout">
      {entries.map(({ id, value }) => (
        <div key={id}>
          <dt hidden>{t(`flight.${id}`)}</dt>
          <span>{t(`flight.${id}`)}</span>
          <dd className="flight-readout__value">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
