// Founding charters (Phase 4): chosen at new game, they shape the whole run.
// Engine reads `effects` through charterEffect() (src/game/engine/charter.js).
// Numbers are first guesses, not tuned (balance comes after the final wave).
//
// effects (all optional; multipliers default to 1):
//   contractPay, salary, combatXp, patronGain, reputationGain, recruitFee,
//   loyalty (+ to new hires), noLoans, scoutTableCost, artifactValue,
//   estimate: { Combat|Diplomacy|Expedition|Intrigue: ± points }, roadHelp

/** The four ways to win Chapter 1 (scores in src/game/engine/connections.js). */
export const PATHS = {
  richest: { id: 'richest', name: 'Richest', icon: 'coin', measure: 'Gold earned' },
  connected: { id: 'connected', name: 'Best connected', icon: 'letter', measure: 'Patron standing and regional reputation' },
  strongest: { id: 'strongest', name: 'Strongest', icon: 'sword', measure: 'Strength rank and wins' },
  legendary: { id: 'legendary', name: 'Most legendary', icon: 'crown', measure: 'Legacy, titles, artifacts, bosses and secrets' },
};

export const CHARTERS = {
  merchant: {
    id: 'merchant',
    name: 'Merchant House',
    crest: 'crest.charter.merchant',
    pitch: 'Coin is a kind of courage. You sign contracts other guilds cannot afford to take.',
    modifiers: ['Contracts pay +15%', 'Start with +400 gold and a Trade House contact', 'Heroes ask for 15% more salary'],
    effects: { contractPay: 1.15, salary: 1.15 },
    start: { gold: 400, patrons: { trade: 25 } },
    recruitClasses: ['Duelist', 'Rogue'],
    favoredFamily: 'Diplomacy',
    path: 'richest',
    signature: 'Become the richest guild in the region.',
  },
  free: {
    id: 'free',
    name: 'Free Company',
    crest: 'crest.charter.free',
    pitch: 'No masters, no ledgers, no apologies. Your heroes fight for the banner and for each other.',
    modifiers: ['Combat XP +25%', 'New hires are 10 points more loyal', 'Patrons warm to you slowly (−40%) and never lend you money'],
    effects: { combatXp: 1.25, loyalty: 10, patronGain: 0.6, noLoans: true },
    start: {},
    recruitClasses: ['Guardian', 'Duelist', 'Ranger'],
    favoredFamily: 'Combat',
    path: 'strongest',
    signature: 'Be the strongest independent guild: top Strength rank with no patron as an Ally.',
  },
  scholars: {
    id: 'scholars',
    name: 'Scholars’ Lodge',
    crest: 'crest.charter.scholars',
    pitch: 'Every ruin is a library with the pages scattered. You came to read them.',
    modifiers: ['Expeditions and investigations +6% success', 'The Scout table costs half', 'Artifacts are worth 50% more', 'Combat −4% success'],
    effects: { estimate: { Expedition: 6, Intrigue: 6, Combat: -4 }, scoutTableCost: 0.5, artifactValue: 1.5 },
    start: {},
    recruitClasses: ['Scholar', 'Mage', 'Artificer'],
    favoredFamily: 'Expedition',
    path: 'legendary',
    signature: 'Uncover the most secrets: story clues, artifacts and rare recruits.',
  },
  shield: {
    id: 'shield',
    name: 'Shield of the People',
    crest: 'crest.charter.shield',
    pitch: 'You answer the call nobody else will pay for. The people remember, and they help.',
    modifiers: ['Reputation grows 50% faster', 'Recruits cost 20% less', 'Folk help you on the road', 'Contracts pay −10%'],
    effects: { reputationGain: 1.5, recruitFee: 0.8, contractPay: 0.9, roadHelp: true },
    start: { patrons: { temple: 15 } },
    recruitClasses: ['Cleric', 'Guardian', 'Ranger'],
    favoredFamily: 'Diplomacy',
    path: 'connected',
    signature: 'Be the most loved guild: the highest regional reputation everywhere.',
  },
};

export const CHARTER_LIST = Object.values(CHARTERS);
