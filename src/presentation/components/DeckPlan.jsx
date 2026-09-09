// Design reference: CLAUDE.md, colour palette and mobile-first rules
import { useTranslation } from 'react-i18next';
import { ROW_HEIGHT, packDeckPlan } from '../../domain/usecases/deckPlan.js';
import { roomColor } from '../../infrastructure/scene/palette.js';
import { formatInteger } from '../../domain/utils/format.js';
import './DeckPlan.css';

const PIXELS_PER_METRE = 5;
const LABEL_MIN_WIDTH_PX = 58;

function hex(value) {
  return `#${value.toString(16).padStart(6, '0')}`;
}

/**
 * The sector rolled out flat. The layout itself is decided in the domain, so
 * this component only draws what packDeckPlan returns and never works out a
 * position of its own.
 */
export default function DeckPlan({ ringId, deck, selectedRoom, onSelectRoom }) {
  const { t, i18n } = useTranslation();
  const plan = packDeckPlan(deck.rooms, deck.radius);
  const width = plan.drawnLength;
  const height = plan.deckWidth;

  return (
    <div className="deck-plan">
      <svg
        className="deck-plan__svg"
        width={width * PIXELS_PER_METRE}
        height={height * PIXELS_PER_METRE + 18}
        viewBox={`0 0 ${width} ${height + 3.6}`}
        role="img"
        aria-label={t('sheet.plan')}
      >
        <rect
          className="deck-plan__corridor"
          x="0"
          y={plan.corridor.y}
          width={width}
          height={plan.corridor.width}
        />
        <text className="deck-plan__corridor-label" x="3" y={plan.corridor.y + 2.6}>
          {t('sheet.corridor')}
        </text>

        {plan.rows.flatMap((row) =>
          row.rooms.map((room) => (
            <g
              key={room.id}
              className={
                room.id === selectedRoom
                  ? 'deck-plan__room deck-plan__room--selected'
                  : 'deck-plan__room'
              }
              tabIndex={0}
              role="button"
              aria-label={t(`ship.room.${ringId}.${deck.index}.${room.id}.name`)}
              onClick={() => onSelectRoom(room.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onSelectRoom(room.id);
              }}
            >
              <rect
                x={room.x}
                y={row.y}
                width={room.width}
                height={ROW_HEIGHT}
                fill={hex(roomColor(room.colorKey))}
              />
              {room.width * PIXELS_PER_METRE > LABEL_MIN_WIDTH_PX ? (
                <>
                  <text x={room.x + 1.4} y={row.y + 4.6}>
                    {t(`ship.room.${ringId}.${deck.index}.${room.id}.name`)}
                  </text>
                  <text x={room.x + 1.4} y={row.y + 8.4} opacity="0.72">
                    {formatInteger(room.area, i18n.language)} {t('units.squareMetre')}
                  </text>
                </>
              ) : null}
            </g>
          ))
        )}

        <rect className="deck-plan__frame" x="0" y="0" width={width} height={height} />
        <text className="deck-plan__dimension" x="0" y={height + 3}>
          {formatInteger(plan.sectorLength, i18n.language)} {t('units.metre')}{' '}
          {t('deck.sectorLength')}
          {' | '}
          {formatInteger(plan.deckWidth, i18n.language)} {t('units.metre')}
          {' | '}
          {formatInteger(plan.sectorLength * plan.deckWidth, i18n.language)}{' '}
          {t('units.squareMetre')} {t('sheet.perSector')}
        </text>
      </svg>
    </div>
  );
}
