import React, { useMemo, useState } from 'react';
import { TOWNS } from '../data/towns/index.js';
import { WILD_AREA_LIST } from '../data/wilds/index.js';
import { Button } from '../components/UI.jsx';
import Icon from '../components/Icon.jsx';
import WalkableScene from './WalkableScene.jsx';
import { townMap, wildMap } from './sceneMap.js';

const PLACES = [...Object.values(TOWNS).map((town) => ({ id: town.id, name: town.name, map: () => townMap(town) })), ...WILD_AREA_LIST.map((area) => ({ id: area.id, name: area.name, map: () => wildMap(area) }))];

/**
 * The art preview (Settings → Developer, or #art-test in the address): every town
 * and wild area as the game draws it, with the normal touch controls, to judge the
 * art without playing to it. Doors and people only say their name; nothing here
 * changes the campaign.
 */
export default function ArtTestScene({ onClose }) {
  const [index, setIndex] = useState(0);
  const [line, setLine] = useState(null);
  const place = PLACES[index];
  const map = useMemo(() => place.map(), [place]);
  const next = () => setIndex((value) => (value + 1) % PLACES.length);

  return (
    <div className="art-test">
      <WalkableScene
        key={place.id}
        map={map}
        start={map.spawn}
        paused={Boolean(line)}
        onInteract={(target) => setLine({ name: target.name, text: `${target.verb || 'Inspect'}: only a preview here.` })}
        className="art-test__scene"
        label={`Art preview: ${place.name}`}
      >
        <div className="art-test__bar">
          <Button size="sm" onClick={next} aria-label="Next place">
            {place.name} <Icon name="next" size={14} tone="plain" />
          </Button>
          <Button size="sm" onClick={onClose} aria-label="Close the art preview">
            <Icon name="close" size={14} tone="plain" /> Close
          </Button>
        </div>
      </WalkableScene>
      {line ? (
        <button type="button" className="art-test__line" onClick={() => setLine(null)} aria-live="polite">
          <strong>{line.name}</strong>
          <span>{line.text}</span>
          <small>Tap to close</small>
        </button>
      ) : null}
    </div>
  );
}
