// Verdicts (docs/design/VERDICTS.md): a short choice at the end of a contract, once its
// required work is done. Which verdict plays comes from the contract's family (VERDICTS_BY_FAMILY).
// Choices show no numbers: the player picks by what they'd do. Every choice records itself
// in the Journal ({ ledger }) and moves honor and dread ({ standing }). Style: docs/DIALOGUE.md.

const narrate = (text) => ({ speaker: '', portrait: 'portrait.poi', text });
const V = (speaker, portrait, lines, choices) => ({ speaker, portrait, decide: true, leave: false, verdict: true, variants: [{ lines, choices }] });
const pick = (text, standing, ledger, extra = [], reply = []) => ({ text, effects: [{ standing: { ...standing, text: ledger } }, { ledger }, ...extra], reply });

export const VERDICTS = {
  // Combat
  'verdict.thief': V('A thief', 'portrait.role.traveller', ['Please. I only took bread and a purse. My sister’s sick.', 'Don’t hand me to the watch. They’ll take the hand anyway.'], [
    pick('Then I’ll save them the trouble.', { honor: -15, dread: 12 }, 'Cut off a thief’s hand and left him in the road', [{ reputation: { region: 'Crownlands', amount: -4 } }], [narrate('He screams. You leave him in the road.')]),
    pick('The watch can decide. Come on.', { honor: 8, dread: 4 }, 'Handed a thief to the watch', [{ gold: 20 }, { flag: 'watchFriend' }], ['…Fine. Fine.']),
    pick('Your purse, and you walk.', { honor: -6 }, 'Let a thief go for his purse', [{ gold: 35 }, { flag: 'thiefInformant' }], ['Take it. Take it and go.']),
    pick('Go home to your sister.', { honor: 10, dread: -4 }, 'Let a thief go home to his sister', [{ patron: { id: 'temple', amount: 3 } }, { flag: 'thiefOwes' }], ['I won’t forget this. I swear it.']),
  ]),
  'verdict.yield': V('A bandit', 'portrait.role.traveller', ['Enough! I yield! I’ve a blade and a few coins. Take them.'], [
    pick('Drop it and run. Tell your friends who did this.', { dread: 8 }, 'Sent a beaten bandit running to warn the others', [{ flag: 'bandsWarned' }], ['Yes. Yes, I’ll tell them.']),
    pick('You’re coming back to answer for it.', { honor: 8 }, 'Brought a yielded bandit back to answer for it', [{ fame: 2 }], ['They’ll hang me.', 'Maybe. That’s not my call.']),
    pick('No yielding today.', { honor: -12, dread: 15 }, 'Cut down a bandit who yielded', [], [narrate('It’s quick. Nobody talks about mercy on that road again.')]),
    pick('Your coins. Then go.', { honor: -4 }, 'Robbed a yielded bandit', [{ gold: 25 }], ['Thieves robbing thieves.']),
  ]),
  'verdict.deserter': V('A deserter', 'portrait.role.traveller', ['Don’t shout. I ran from the Argent Crown’s levy. They’ll flog me to death.'], [
    pick('Walk with us. Keep your head down.', { honor: 8 }, 'Hid a deserter from the Argent Crown’s levy', [{ flag: 'deserterHelped' }], ['I owe you my back.']),
    pick('They pay a reward for runaways.', { honor: -10, dread: 6 }, 'Sold a deserter back to the Argent Crown', [{ gold: 60 }], ['You’re no better than them.']),
    pick('We never saw you.', { honor: 4 }, 'Let a deserter slip away', [], ['…Thank you.']),
  ]),
  'verdict.village': V('A village elder', 'portrait.role.council-steward', ['Yes, we fed them. They’d have burned us if we didn’t.', 'Do what you came to do. But the children didn’t choose this.'], [
    pick('Nobody here will be punished.', { honor: 8 }, 'Spared a village that fed outlaws', [{ reputation: { region: 'Crownlands', amount: 4 } }], ['Bless you. The mill: that’s where they kept their stores.']),
    pick('Next time, you’ll fear us more than them.', { honor: -12, dread: 15 }, 'Burned a village barn as a warning', [{ reputation: { region: 'Crownlands', amount: -6 } }, { flag: 'bandsWarned' }], [narrate('You make an example of the headman’s barn.')]),
    pick('Then the village pays their bounty.', { honor: -6 }, 'Made a village pay the outlaws’ bounty', [{ gold: 50 }], ['With what?', 'You’ll find it.']),
  ]),
  // Diplomacy
  'verdict.farmer': V('A farmer', 'portrait.role.traveller', ['You did all of it. I know. But the harvest failed, and I’ve half what I promised.'], [
    pick('Half will do. Keep the rest for seed.', { honor: 10 }, 'Took half pay from a farmer after a failed harvest', [{ gold: -20 }, { reputation: { region: 'Crownlands', amount: 6 } }], ['Bless you. The whole valley will hear.']),
    pick('We agreed a price.', { honor: -6, dread: 4 }, 'Took a farmer’s cow for the rest of the fee', [{ gold: 20 }], ['Then take the cow. She’s all we have.']),
    pick('Then we’ll take it out of your barn.', { honor: -12, dread: 8 }, 'Emptied a poor farmer’s barn for a fee', [{ gold: 40 }, { reputation: { region: 'Crownlands', amount: -6 } }], [narrate('You leave with sacks of grain. The children watch from the door.')]),
    pick('Pay us next year, with something extra.', {}, 'Let a farmer owe the rest until next year', [{ flag: 'farmerDebt' }], ['Next year. I swear.']),
  ]),
  'verdict.widow': V('A widow', 'portrait.role.traveller', ['He wants the house for a debt my husband ran up. I have nothing else.'], [
    pick('Tell him the debt is paid. We’ll cover it.', { honor: 15 }, 'Paid a widow’s debt to a noble', [{ gold: -40 }], ['Why would you do that?', 'Because we can.']),
    pick('You have a week to leave.', { honor: -10, dread: 6 }, 'Turned a widow out of her house for a noble', [{ gold: 40 }], [narrate('She doesn’t argue. That’s the worst part.')]),
    pick('Talk to him yourself. We’ll stand with you.', { honor: 8 }, 'Stood with a widow against a noble', [{ reputation: { region: 'Crownlands', amount: 4 } }], ['…You’d do that?']),
  ]),
  // Intrigue
  'verdict.papers': V('A clerk', 'portrait.role.herald-s-clerk', ['That’s not only what they hired you for. Those papers show who’s been paid off.', 'The council would pay to see them. The people in them would pay more not to.'], [
    pick('Then the council sees them.', { honor: 10, dread: 4 }, 'Gave the council papers that named the bribed', [{ patron: { id: 'trade', amount: -3 } }, { reputation: { region: 'Crownlands', amount: 4 } }], ['Brave. Or foolish. We’ll find out which.']),
    pick('Let’s find out who pays more.', { honor: -10 }, 'Sold incriminating papers to the people in them', [{ gold: 90 }, { flag: 'blackmail' }], ['I’ll make the introductions. For a share.']),
    pick('Burn them. Not our business.', {}, 'Burned papers that weren’t our business', [], [narrate('The pages curl in the brazier.'), 'Sensible.']),
  ]),
  'verdict.prisoner': V('A courier', 'portrait.role.messenger', ['I’ll talk. Names, places. Just don’t send me back where I came from.'], [
    pick('Talk, and you go free.', { honor: 4 }, 'Freed a courier for what he knew', [{ flag: 'courierLead' }], ['The foundry boss pays the raiders. There. I’m done.']),
    pick('You’ll talk either way.', { honor: -10, dread: 10 }, 'Beat the truth out of a courier', [{ flag: 'courierLead' }], [narrate('He talks. It takes an hour.')]),
    pick('The watch can have you.', { honor: -4 }, 'Handed a courier to the watch for the reward', [{ gold: 40 }], ['Then you’ve killed me.']),
  ]),
  // Expedition
  'verdict.well': V('A herbalist', 'portrait.role.herb-seller', ['Someone soured the well on purpose. A rival trader, I’d wager.', 'I can clean it. It takes days, and your help hauling.'], [
    pick('We’ll haul. Start now.', { honor: 8 }, 'Helped clean a poisoned well', [{ passDays: 3 }, { reputation: { region: 'Crownlands', amount: 6 } }], ['Good hands. The village will drink by Sunday.']),
    pick('Find me who did it instead.', { dread: 4 }, 'Went after whoever poisoned a well', [{ gold: 30 }], ['Follow the cart tracks east.']),
    pick('Our job was to find it, not fix it.', { honor: -4 }, 'Left a poisoned well for someone else', [], ['Then go. I’ll do it alone.']),
  ]),
  'verdict.shrine': V('An old shrine', 'portrait.poi', [narrate('Under the moss, a box of offerings. Old coins, a silver lamp. No one has come in years.')], [
    pick('Leave it. It isn’t ours.', { honor: 6 }, 'Left an old shrine’s offerings where they lay', [{ patron: { id: 'temple', amount: 2 } }], [narrate('You light the lamp before you go.')]),
    pick('Take it. The dead don’t spend.', { honor: -8 }, 'Robbed an old shrine', [{ gold: 70 }], [narrate('The lamp is heavier than it looks.')]),
    pick('Take it to the temple in town.', { honor: 8 }, 'Brought a shrine’s offerings to the temple', [{ gold: 15 }, { patron: { id: 'temple', amount: 4 } }], ['Dawn’s blessing on you. And a small finder’s fee.']),
  ]),
};

// Story verdicts (Chapter 1): played as story steps (src/data/story.js).
export const STORY_VERDICTS = {
  'story.verdict.handler': V('The Wolfskin handler', 'portrait.role.traveller', ['You’ve killed my pack. Kill me too, or let me crawl away. I don’t care which.'], [
    pick('Crawl, then. And tell whoever pays you that we’re coming.', { honor: 4, dread: 4 }, 'Let the Wolfskin handler crawl away with a warning', [{ choice: { handler: 'spared' } }, { flag: 'handlerSpared' }], [narrate('He crawls into the trees. You’ll hear of him again.')]),
    pick('The road’s had enough of your kind.', { honor: -10, dread: 12 }, 'Killed the Wolfskin handler', [{ choice: { handler: 'killed' } }, { flag: 'bandsWarned' }], [narrate('The Old Road is quieter after that. Much quieter.')]),
    pick('Corwin can decide what to do with you.', { honor: 8 }, 'Brought the Wolfskin handler to Corwin', [{ choice: { handler: 'corwin' } }, { fame: 2 }], ['Corwin’s a merchant. He’ll sell me to the watch.', 'Then you’d better be worth something.']),
  ]),
  'story.verdict.malric': V('Brother Malric', 'portrait.role.priest', ['Enough. The gate is yours. I only sold what the pilgrims were too frightened to keep.'], [
    pick('The temple can judge you.', { honor: 10 }, 'Gave Brother Malric to the temple’s judgement', [{ choice: { malric: 'temple' } }, { patron: { id: 'temple', amount: 6 } }], ['Aveline will be harder on me than you would.']),
    pick('Give back what you took. Then go.', { honor: 6 }, 'Made Brother Malric give back what he took', [{ choice: { malric: 'returned' } }, { gold: 40 }, { reputation: { region: 'Crownlands', amount: 6 } }], ['…The strongbox is under the altar. Take it to them.']),
    pick('Kneel. The road will see this.', { honor: -12, dread: 15 }, 'Made an example of Brother Malric', [{ choice: { malric: 'example' } }, { patron: { id: 'temple', amount: -6 } }], [narrate('The pilgrims who see it never speak of it. They don’t need to.')]),
  ]),
};

/** Which verdicts can follow a contract, by its family (src/game/engine/reputation.js missionFamily). */
export const VERDICTS_BY_FAMILY = {
  Combat: ['verdict.thief', 'verdict.yield', 'verdict.deserter', 'verdict.village'],
  Diplomacy: ['verdict.farmer', 'verdict.widow'],
  Intrigue: ['verdict.papers', 'verdict.prisoner'],
  Expedition: ['verdict.well', 'verdict.shrine'],
};
