// Data-driven dialogue. The engine (src/game/engine/exploration.js) picks the
// variant, checks conditions and applies effects; DialogueBox.jsx shows it.
//
// Conversation:
//   { speaker, portrait, variants: [Variant, …] }      first variant whose `if` passes is used
// Variant:
//   { if?, effects?, lines: [Line, …], choices?: [Choice, …] }
//   `effects` apply once each time the variant is shown (talking to someone).
// Line:    'text'  or  { speaker, portrait, text }       {guild} and {founder} are filled in
// Choice:  { text, if?, effects?, reply?: [Line, …] }    a "Leave" choice is always added
//
// Conditions (all keys must hold):
//   talked: bool             this conversation happened before
//   oldRoadCleared: bool     the Wolves on the Old Road contract is done
//   tierAtLeast: n           guild tier (0 Regional, 1 National…)
//   fameAtLeast: n, goldAtLeast: n
//   any: [Condition, …]      at least one holds
//   The story (src/data/story.js): prologueDone, tutorialSkipped, tutorialDone: bool;
//   chapterAtLeast: n; storyDone: missionId (or list), notStoryDone, storyActive: id;
//   evidence: id, evidenceAtLeast: n, codex: id; choice / notChoice: { name: value };
//   storyHero / notStoryHero: id, storyHeroLoyalty: { id, at }; contractsWon: n;
//   regionLevel: { region: n }; heroClass: { classId, level }; signedUp: tournamentId;
//   tournamentPlayed: tournamentId | 'any'; freeBed, atHome, hallLeased: bool
//   season: 'spring' | 'summer' | 'autumn' | 'winter' (or a list)
//   flag: name, notFlag: name  (state.flags.dialogue)
//   candidateHere: bool      a recruit is in this town
//   visitedArea: id, bossDefeated: area id
//   charter: id (or list)    the founding charter (src/data/charters.js)
//   patronAtLeast: { patronId: 'contact'|'partner'|'ally' }, patronBelow: { … }
//   patronRival: patronId, patronGiftReady: patronId (no gift this month and 50 gold)
//
// Effects:
//   { gold: n }  { item: { itemId: n } }  { reputation: { region, amount } }
//   { relationship: n }                     with the speaker (state.world.npcs)
//   { flag: name }                          sets state.flags.dialogue[name]; also known top-level flags
//   { rumor: { location, note } }           marks a place as rumored on the world map
//   { event: { id, note } }                 records a known event
//   { open: buildingId }                    UI: opens that building
//   { recruit: true }                       UI: shows a recruit offer from this town
//   { patron: { id, amount } }              standing with a patron (src/data/patrons.js)
//   { patronGift: patronId }                50 gold for standing, once a month
import dunmere from './dunmere.js';
import greenhollow from './greenhollow.js';
import ironford from './ironford.js';
import wilds from './wilds.js';

export const DIALOGUES = { ...dunmere, ...greenhollow, ...ironford, ...wilds };

/** Flags that live at state.flags[name] (other systems read them), not in state.flags.dialogue. */
export const TOP_LEVEL_FLAGS = ['oldRoadIntroduced', 'harvestMeleeIntroduced'];

export const SEASON_MONTHS = { winter: [11, 0, 1], spring: [2, 3, 4], summer: [5, 6, 7], autumn: [8, 9, 10] };
