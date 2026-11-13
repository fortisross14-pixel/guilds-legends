// Where contracts happen (missions-in-world spec). A contract's objectives are
// placed in one of three kinds of place:
// - `wild`: a wild area near the town (src/data/wilds); objectives stand on
//   free walkable tiles (`anchors`, [x, y] tiles, checked reachable from the
//   area's entrance);
// - `town`: the town's own walkable map (talk-heavy contracts: people around
//   town, clues on the streets), on free tiles of the town;
// - `painted`: a painted scene entered through a door in the town (`door` tile),
//   with people at `spots` and clues in `boxes` (percentages of the painting).
// Tiles were picked with a reachability script (docs/PLAYTEST_CH1.md, session 4).

export const WILD_ANCHORS = {
  'old-road': [[40, 22], [53, 19], [25, 6], [21, 21], [56, 6], [33, 21], [50, 23], [27, 4], [11, 21]],
  'thornwood-edge': [[24, 10], [17, 10], [27, 13], [13, 15], [9, 11], [23, 14], [17, 17], [6, 14], [18, 6]],
  blackwood: [[31, 8], [30, 7], [32, 10], [26, 12], [31, 13]],
};

export const TOWN_ANCHORS = {
  dunmere: [[10, 10], [14, 11], [17, 14], [27, 15], [9, 14], [30, 12], [13, 15], [33, 15]],
  greenhollow: [[15, 9], [13, 13], [17, 14], [26, 10], [8, 12], [26, 14], [30, 10], [14, 17]],
  ironford: [[14, 11], [27, 11], [11, 21], [30, 21], [35, 12], [44, 13], [27, 30], [13, 28]],
  windmere: [[14, 6], [34, 7], [25, 10], [3, 12], [17, 19], [29, 22], [22, 25], [39, 25]],
};

/** Painted sites: a scene behind a door in town. Spots for people and fights, boxes for clues. */
export const PAINTED_SITES = {
  'ironford-slagpits': {
    name: 'The slag pits',
    art: 'site.ironford.slagpits',
    town: 'ironford',
    door: [12, 18],
    spots: [[50, 58], [30, 66], [70, 66], [50, 76], [20, 52]],
    boxes: [[8, 30, 14, 22], [78, 30, 14, 22], [40, 4, 20, 20], [86, 58, 12, 20]],
  },
  'ironford-archive': {
    name: 'The archive vault',
    art: 'site.ironford.archive',
    town: 'ironford',
    door: [33, 18],
    spots: [[50, 46], [33, 75], [80, 78], [62, 70], [20, 70]],
    boxes: [[71, 6, 21, 36], [8, 6, 21, 36], [37, 4, 26, 34], [44, 64, 14, 16]],
  },
  'windmere-cliffs': {
    name: 'The cliff path',
    art: 'site.windmere.cliffs',
    town: 'windmere',
    door: [10, 18],
    spots: [[50, 58], [36, 72], [64, 72], [50, 80], [86, 62]],
    boxes: [[6, 30, 14, 26], [80, 30, 14, 26], [44, 4, 12, 22], [60, 84, 14, 14]],
  },
};

/** The default place for a contract: the wild area by the town, or a painted site where there is none. */
export const TOWN_WILD = { dunmere: 'old-road', greenhollow: 'thornwood-edge' };
export const TOWN_PAINTED = { ironford: 'ironford-slagpits', windmere: 'windmere-cliffs' };
