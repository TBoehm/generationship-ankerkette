// Design reference: CLAUDE.md, colour palette and mobile-first rules
import { useTranslation } from 'react-i18next';
import { SHIP_SECTIONS } from '../../domain/constants/shipSections.js';
import {
  breadcrumbOf,
  decksOf,
  levelOf,
  roomsAt,
  select,
} from '../../domain/usecases/selection.js';
import {
  coriolisAcceleration,
  gravityAt,
  rimSpeed,
  sectorArea,
  sectorLength,
  usableRoomArea,
} from '../../domain/usecases/deckGeometry.js';
import { HABITAT } from '../../domain/constants/shipDesign.js';
import { formatDecimal, formatInteger } from '../../domain/utils/format.js';
import { sectionColor } from '../../infrastructure/scene/palette.js';
import DeckPlan from './DeckPlan.jsx';
import './SectionSheet.css';

function hex(value) {
  return `#${value.toString(16).padStart(6, '0')}`;
}

function Facts({ entries }) {
  return (
    <div className="section-sheet__facts">
      {entries.map(({ id, label, value }) => (
        <div key={id}>
          {label} <b>{value}</b>
        </div>
      ))}
    </div>
  );
}

export default function SectionSheet({ selection, onSelect }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const level = levelOf(selection);
  const crumbs = breadcrumbOf(selection);

  const crumbLabel = (crumb) => {
    if (crumb.level === 'index') return t('sheet.index');
    if (crumb.level === 'section') return t(`ship.section.${selection.section}.name`);
    if (crumb.level === 'deck')
      return t(`ship.deck.${selection.section}.${selection.deck}.name`).split(',')[0];
    return t(`ship.room.${selection.section}.${selection.deck}.${selection.room}.name`);
  };

  const goTo = (crumb) => {
    if (crumb.level === 'index') onSelect({ section: null, deck: null, room: null });
    else if (crumb.level === 'section') onSelect({ ...selection, deck: null, room: null });
    else if (crumb.level === 'deck') onSelect({ ...selection, room: null });
  };

  return (
    <div className="section-sheet">
      <nav className="section-sheet__crumbs" aria-label={t('sheet.index')}>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span key={crumb.level}>
              {index > 0 ? <span aria-hidden="true"> / </span> : null}
              <button
                type="button"
                className={
                  isLast
                    ? 'section-sheet__crumb section-sheet__crumb--current'
                    : 'section-sheet__crumb'
                }
                disabled={isLast}
                onClick={() => goTo(crumb)}
              >
                {crumbLabel(crumb)}
              </button>
            </span>
          );
        })}
      </nav>

      {level === 'index' ? (
        <ul className="section-sheet__list">
          {SHIP_SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                className="section-sheet__entry"
                onClick={() => onSelect(select(selection, { section: section.id }))}
              >
                <span className="section-sheet__entry-name">
                  <svg className="section-sheet__swatch" viewBox="0 0 8 8" aria-hidden="true">
                    <rect width="8" height="8" rx="2" fill={hex(sectionColor(section.colorKey))} />
                  </svg>
                  {t(`ship.section.${section.id}.name`)}
                </span>
                <span className="section-sheet__entry-role">
                  {t(`ship.section.${section.id}.role`)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {level === 'section' ? (
        <div className="section-sheet__detail">
          <p>{t(`ship.section.${selection.section}.description`)}</p>
          {decksOf(selection.section).length === 0 ? (
            <p>{t('sheet.noDecks')}</p>
          ) : (
            <ul className="section-sheet__list">
              {decksOf(selection.section).map((deck) => (
                <li key={deck.index}>
                  <button
                    type="button"
                    className="section-sheet__entry"
                    onClick={() => onSelect(select(selection, { deck: deck.index }))}
                  >
                    <span className="section-sheet__entry-name">
                      {t(`ship.deck.${selection.section}.${deck.index}.name`)}
                    </span>
                    <span className="section-sheet__entry-role">
                      {t(`ship.deck.${selection.section}.${deck.index}.use`)}, {deck.radius}{' '}
                      {t('units.metre')}, {formatDecimal(gravityAt(deck.radius), lang, 2)}{' '}
                      {t('units.gravity')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {level === 'deck' || level === 'room' ? (
        <DeckDetail selection={selection} onSelect={onSelect} lang={lang} t={t} level={level} />
      ) : null}
    </div>
  );
}

function DeckDetail({ selection, onSelect, lang, t, level }) {
  const deck = decksOf(selection.section).find((entry) => entry.index === selection.deck);
  if (!deck) return null;
  const rooms = roomsAt(selection);
  const room = rooms.find((entry) => entry.id === selection.room) ?? null;

  return (
    <div className="section-sheet__detail">
      <DeckPlan
        ringId={selection.section}
        deck={deck}
        selectedRoom={selection.room}
        onSelectRoom={(id) => onSelect(select(selection, { room: id }))}
      />

      {level === 'deck' ? (
        <>
          <p>{t(`ship.deck.${selection.section}.${deck.index}.note`)}</p>
          <Facts
            entries={[
              {
                id: 'radius',
                label: t('deck.radius'),
                value: `${deck.radius} ${t('units.metre')}`,
              },
              {
                id: 'gravity',
                label: t('deck.gravity'),
                value: `${formatDecimal(gravityAt(deck.radius), lang, 2)} ${t('units.gravity')}`,
              },
              {
                id: 'sectorLength',
                label: t('deck.sectorLength'),
                value: `${formatDecimal(sectorLength(deck.radius), lang, 1)} ${t('units.metre')}`,
              },
              {
                id: 'sectorArea',
                label: t('deck.sectorArea'),
                value: `${formatInteger(sectorArea(deck.radius), lang)} ${t('units.squareMetre')}`,
              },
              {
                id: 'rimSpeed',
                label: t('deck.rimSpeed'),
                value: `${formatDecimal(rimSpeed(deck.radius), lang, 1)} ${t('units.metrePerSecond')}`,
              },
              {
                id: 'coriolis',
                label: t('deck.coriolis'),
                value: `${formatDecimal(coriolisAcceleration(HABITAT.walkingSpeed), lang, 2)} ${t('units.metrePerSecondSquared')}`,
              },
            ]}
          />
        </>
      ) : null}

      {room ? (
        <>
          <p>{t(`ship.room.${selection.section}.${deck.index}.${room.id}.description`, '')}</p>
          <Facts
            entries={[
              {
                id: 'area',
                label: t('room.area'),
                value: `${formatInteger(room.area, lang)} ${t('units.squareMetre')}`,
              },
              {
                id: 'allSectors',
                label: t('room.allSectors'),
                value: `${formatInteger(room.area * HABITAT.sectorsPerRing, lang)} ${t('units.squareMetre')}`,
              },
              {
                id: 'share',
                label: t('room.share'),
                value: `${formatDecimal((room.area / usableRoomArea(deck.radius)) * 100, lang, 1)} ${t('units.percent')}`,
              },
            ]}
          />
        </>
      ) : null}
    </div>
  );
}
