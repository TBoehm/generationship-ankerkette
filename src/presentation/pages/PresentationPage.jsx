// Design reference: CLAUDE.md, colour palette and mobile-first rules
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import SceneCanvas from '../components/SceneCanvas.jsx';
import FocusSwitch from '../components/FocusSwitch.jsx';
import FlightReadout from '../components/FlightReadout.jsx';
import ShipReadout from '../components/ShipReadout.jsx';
import FlightControls from '../components/FlightControls.jsx';
import SectionSheet from '../components/SectionSheet.jsx';
import { EMPTY_SELECTION, select } from '../../domain/usecases/selection.js';
import { advanceDistance, chapterAt, readoutAt } from '../../domain/usecases/flightPresentation.js';
import { MISSION } from '../../domain/constants/missionProfile.js';
import { ROUTES } from '../../domain/constants/routes.js';
import './PresentationPage.css';

const PLAYBACK_YEARS_PER_SECOND = 6;

const focusForPath = (pathname) => (pathname === ROUTES.ship ? 'ship' : 'flight');

/**
 * The one view. The ship and the journey are two scenes behind a single
 * canvas, and this page is the chrome around them: it holds what the user has
 * chosen and forwards it to the stage, and it never touches three.js itself.
 */
export default function PresentationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const stageRef = useRef(null);
  const settingsRef = useRef(null);
  const [focus, setFocus] = useState(() => focusForPath(pathname));
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [distance, setDistance] = useState(MISSION.startDistance);
  const [playing, setPlaying] = useState(false);
  const [cameraMode, setCameraMode] = useState('chase');
  const [boostSizes, setBoostSizes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  /**
   * Everything the user chose before the scene finished loading has to be
   * pushed once it arrives. The effects below run against a stage that does
   * not exist yet on the first render, and a deep link to /ship sets the focus
   * in exactly that window, which is how the ship route ended up showing the
   * journey.
   */
  const onReady = useCallback((stage) => {
    stageRef.current = stage;
    stage.onSelect((picked) => setSelection((current) => select(current, picked)));
    const settings = settingsRef.current;
    stage.setFocus(settings.focus);
    stage.setSelection(settings.selection);
    stage.setDistance(settings.distance);
    stage.setCameraMode(settings.cameraMode);
    stage.setBoostSizes(settings.boostSizes);
    stage.setShowLabels(settings.showLabels);
  }, []);

  settingsRef.current = { focus, selection, distance, cameraMode, boostSizes, showLabels };

  const withStage = (apply) => {
    const stage = stageRef.current;
    if (stage) apply(stage);
  };

  useEffect(() => withStage((stage) => stage.setFocus(focus)), [focus]);
  useEffect(() => withStage((stage) => stage.setSelection(selection)), [selection]);
  useEffect(() => withStage((stage) => stage.setDistance(distance)), [distance]);
  useEffect(() => withStage((stage) => stage.setCameraMode(cameraMode)), [cameraMode]);
  useEffect(() => withStage((stage) => stage.setBoostSizes(boostSizes)), [boostSizes]);
  useEffect(() => withStage((stage) => stage.setShowLabels(showLabels)), [showLabels]);

  useEffect(() => setFocus(focusForPath(pathname)), [pathname]);

  useEffect(() => {
    if (!playing) return undefined;
    let frame = 0;
    let previous = null;
    const step = (timestamp) => {
      if (previous !== null) {
        const years = ((timestamp - previous) / 1000) * PLAYBACK_YEARS_PER_SECOND;
        setDistance((current) => {
          const next = current + advanceDistance(current, years);
          return next >= MISSION.totalDistance ? MISSION.totalDistance : next;
        });
      }
      previous = timestamp;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    if (distance >= MISSION.totalDistance) setPlaying(false);
  }, [distance]);

  const chooseFocus = (next) => {
    setFocus(next);
    navigate(next === 'ship' ? ROUTES.ship : ROUTES.flight);
  };

  const readout = readoutAt(distance);

  return (
    <>
      <SceneCanvas onReady={onReady} />
      <div className="presentation">
        <div className="presentation__plate">
          <div className="presentation__head">
            <h1 className="presentation__title">
              {t('app.title')} <span>{t('app.subtitle')}</span>
            </h1>
            <FocusSwitch focus={focus} onChange={chooseFocus} />
          </div>
          {focus === 'flight' ? <FlightReadout readout={readout} /> : <ShipReadout />}
        </div>

        <div className="presentation__spacer" />

        <div className="presentation__dock">
          {focus === 'flight' ? (
            <FlightControls
              distance={distance}
              playing={playing}
              cameraMode={cameraMode}
              boostSizes={boostSizes}
              showLabels={showLabels}
              chapter={chapterAt(distance)}
              onDistance={setDistance}
              onTogglePlay={() => setPlaying((on) => !on)}
              onCameraMode={setCameraMode}
              onToggleSizes={() => setBoostSizes((on) => !on)}
              onToggleLabels={() => setShowLabels((on) => !on)}
            />
          ) : (
            <SectionSheet selection={selection} onSelect={setSelection} />
          )}
        </div>
      </div>
    </>
  );
}
