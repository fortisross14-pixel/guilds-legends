// Data-driven dialogue. The engine (src/game/engine/exploration.js) picks the
// variant, checks conditions and applies effects; DialogueBox.jsx shows it.
// How conversations should read (rules, shape, voices): docs/DIALOGUE.md.
//
// Conversation:
//   { speaker, portrait, variants: [Variant, …], topics?, bye?, decide?, leave? }
//   variants: the NPC's opener. The first variant whose `if` passes is used, so put
//     reactions first (story progress, rank, season, charter), then the return-visit
//     opener (`talked: true`), then the first meeting (with names) last.
//   topics: the hub, asked in any order: [{ id, text, if?, lines, effects? }]. `text` is
//     what the player says; `lines` the answer. Entries sharing an id are versions
//     (the first whose `if` holds is shown). Asked topics are remembered and checked.
//   bye: { text, lines? }: the player's goodbye and the NPC's farewell.
//   decide: true: a decision scene (story). The topics sit beside the variant's choices:
//     ask first, then decide. Without it, choices are small talk and lead into the hub.
//   leave: the label of the way out of a scene or object without a hub ('Move on',
//     'Not now.'), or false when the only way out is a choice. Default 'Leave'.
// Variant:
//   { if?, effects?, lines: [Line, …], choices?: [Choice, …] }
//   `effects` apply once each time the variant is shown (talking to someone).
// Line:    'text'  or  { speaker, portrait, text }       {guild} and {founder} are filled in
// Choice:  { text, if?, effects?, reply?: [Line, …] }     `text` is what the player says
//
// Conditions (all keys must hold):
//   talked: bool             this conversation happened before
//   oldRoadCleared: bool     the Wolfskins on the Old Road contract is done
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
//   visitedArea: id, bossDefeated: area id, wildBeaten: 'areaId:groupId',
//   levelAtLeast: n (any hero), gearEquipped: bool (any hero wears a gear item)
//   charter: id (or list)    the founding charter (src/data/charters.js)
//   patronAtLeast: { patronId: 'contact'|'partner'|'ally' }, patronBelow: { … }
//   patronRival: patronId, patronGiftReady: patronId (no gift this month and 50 gold)
//   Items (docs/design/ITEMS.md): hasItem: { itemId: n }, notItem: itemId (or list)
//   Standing (docs/design/PILLARS.md): honorAtLeast: n, honorBelow: n, dreadAtLeast: n,
//   honorBand: 'honourable' | 'neutral' | 'wicked' (or a list)
//
// Effects:
//   { gold: n }  { item: { itemId: n } }  { reputation: { region, amount } }
//   { relationship: n }                     with the speaker (state.world.npcs)
//   { flag: name }                          sets state.flags.dialogue[name]; also known top-level flags
//   { rumor: { location, note } }           marks a place as rumored on the world map
//   { event: { id, note } }                 records a known event
//   { open: buildingId }                    UI: opens that building
//   Story (src/data/story.js): { codex: id | [ids] }, { evidence: id }, { choice: { name: value } },
//   { route: name } (the mission's contract route), { storyRecruit: heroId }, { rentLot: deposit } (rents the Dunmere lot, src/data/lots.js),
//   { passDays: n }, { fame: n }, { legacy: n }, { heroLoyalty: { id, amount } } (a story hero),
//   { wait: true } (keep a story scene open)
//   { recruit: true }                       a keeper's introduction: the tavern's recruits become known, the tavern opens
//   { patron: { id, amount } }              standing with a patron (src/data/patrons.js)
//   { patronGift: patronId }                50 gold for standing, once a month
//   { giveItem: { itemId: n } }, { takeItem: { itemId: n } }   items to or from the guild
//   { standing: { honor, dread, text } }    honor and dread move; `text` goes in the standing log
import dunmere from './dunmere.js';
import greenhollow from './greenhollow.js';
import ironford from './ironford.js';
import windmere from './windmere.js';
import wilds from './wilds.js';
import story from './story.js';
import storyAct2 from './storyAct2.js';

export const DIALOGUES = { ...dunmere, ...greenhollow, ...ironford, ...windmere, ...wilds, ...story, ...storyAct2 };

/** Flags that live at state.flags[name] (other systems read them), not in state.flags.dialogue. */
export const TOP_LEVEL_FLAGS = ['oldRoadIntroduced', 'harvestMeleeIntroduced'];

export const SEASON_MONTHS = { winter: [11, 0, 1], spring: [2, 3, 4], summer: [5, 6, 7], autumn: [8, 9, 10] };
