// Design reference: CLAUDE.md, colour palette and mobile-first rules
import { useTranslation } from 'react-i18next';
import { CHAPTERS } from '../../domain/constants/chapters.js';
import { distanceToSlider, sliderToDistance } from '../../domain/usecases/timelineScale.js';
import './FlightControls.css';

const CAMERA_MODES = ['chase', 'system', 'front', 'back'];
const SLIDER_STEP = 0.00005;

export default function FlightControls({
  focusBody,
  onReleaseFocus,
  distance,
  playing,
  cameraMode,
  boostSizes,
  showLabels,
  chapter,
  onDistance,
  onTogglePlay,
  onCameraMode,
  onToggleSizes,
  onToggleLabels,
}) {
  const { t } = useTranslation();

  return (
    <div className="flight-controls">
      {chapter ? (
        <div>
          <div className="flight-controls__chapter-title">{t(chapter.titleKey)}</div>
          <p className="flight-controls__chapter-text">{t(chapter.textKey)}</p>
        </div>
      ) : null}

      {focusBody ? (
        <div className="flight-controls__focus">
          <span className="flight-controls__focus-label">{t('flight.circling')}</span>
          <span className="flight-controls__focus-name">{t(focusBody.nameKey)}</span>
          <button type="button" className="flight-controls__chip" onClick={onReleaseFocus}>
            {t('flight.release')}
          </button>
        </div>
      ) : null}

      <div className="flight-controls__transport">
        <button
          type="button"
          className={
            playing ? 'flight-controls__play flight-controls__play--on' : 'flight-controls__play'
          }
          aria-pressed={playing}
          onClick={onTogglePlay}
        >
          {playing ? t('flight.pause') : t('flight.play')}
        </button>
        <input
          className="flight-controls__slider"
          type="range"
          min="0"
          max="1"
          step={SLIDER_STEP}
          value={distanceToSlider(distance)}
          aria-label={t('flight.position')}
          onChange={(event) => onDistance(sliderToDistance(Number(event.target.value)))}
        />
      </div>

      <div className="flight-controls__row" aria-label={t('flight.chapters')}>
        {CHAPTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={
              chapter && chapter.id === entry.id
                ? 'flight-controls__chip flight-controls__chip--on'
                : 'flight-controls__chip'
            }
            onClick={() => onDistance(entry.distance)}
          >
            {t(entry.titleKey)}
          </button>
        ))}
      </div>

      <div className="flight-controls__row">
        {CAMERA_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={cameraMode === mode}
            className={
              cameraMode === mode
                ? 'flight-controls__chip flight-controls__chip--on'
                : 'flight-controls__chip'
            }
            onClick={() => onCameraMode(mode)}
          >
            {t(`flight.mode.${mode}`)}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={boostSizes}
          className={
            boostSizes ? 'flight-controls__chip flight-controls__chip--on' : 'flight-controls__chip'
          }
          onClick={onToggleSizes}
        >
          {boostSizes ? t('flight.sizes.boosted') : t('flight.sizes.true')}
        </button>
        <button
          type="button"
          aria-pressed={showLabels}
          className={
            showLabels ? 'flight-controls__chip flight-controls__chip--on' : 'flight-controls__chip'
          }
          onClick={onToggleLabels}
        >
          {showLabels ? t('flight.labels.on') : t('flight.labels.off')}
        </button>
      </div>
    </div>
  );
}
