// Dunmere conversations. Format: src/data/dialogue/index.js; style and voices: docs/DIALOGUE.md.
// Each conversation: the NPC opens (first meeting, return visit, or a reaction),
// one small-talk exchange, then a hub of topics in any order, then goodbye.
import { patronTopics } from './patronTalk.js';
const P = (id) => `portrait.dunmere.${id}`;

// Corwin speaks for the Dunmere Trade House (src/data/patrons.js).
const TRADE = patronTopics('trade', 'the Trade House', {
  ally: ['Allies. The House opens its books to you now, and its warehouses.'],
  partner: ['Partners. There’s a charter contract on the board each month with your name on it.'],
  contact: ['A name in the ledger, and a good one. Keep taking our work and the prices get kinder.'],
  stranger: ['Honestly? A guild we haven’t done business with yet.', 'Our contracts carry our seal. Take one and we’ll talk again.'],
  gift: ['He weighs the purse and smiles. “The House notices courtesy.”'],
});

export default {
  // Mara Fen: practical, skeptical, dry humor; calls people "love". Keeps the Wayfarer's bar.
  'dunmere.innkeeper': {
    speaker: 'Mara Fen',
    portrait: P('innkeeper'),
    variants: [
      // How they feel about the guild (its standing: fear, respect, disgust, warmth).
      { if: { talked: true, quadrant: 'fear' }, lines: ['Evening. What’ll it be? …Quickly, love. People get nervous when your lot sits down.'] },
      { if: { talked: true, quadrant: 'respect' }, lines: ['Well, if it isn’t {epithet}! Sit, love, the good table’s yours. People feel safer with you in the room.'] },
      { if: { talked: true, quadrant: 'disgust' }, lines: ['You. I’ll pour, because coin’s coin. Don’t expect me to smile about it.'] },
      { if: { talked: true, quadrant: 'compassion' }, lines: ['Ah, love. You look tired. Sit. The first one’s on the house for people like you.'] },
      {
        if: { talked: true, tierAtLeast: 1 },
        lines: ['Well, look at you. Promoted, and you still drink here. I’m almost touched.'],
      },
      {
        if: { talked: true, fameAtLeast: 60 },
        lines: ['People ask me about {guild} now. I tell them you tip badly. Keeps you humble.'],
      },
      {
        if: { talked: true },
        lines: ['Back again, love? Pull up a stool. What’ll it be: gossip, introductions or both?'],
      },
      {
        lines: ['A new face at my bar. Sit before you fall over, love.', 'I’m Mara. This is the Wayfarer. Who’s asking for a drink?'],
        choices: [
          { text: '{founder}. I just started a guild.', reply: ['Have you now. Half this room “just started a guild” once. Ask them how that went.'] },
          { text: 'Someone with a banner and no idea what to do with it.', effects: [{ relationship: 1 }], reply: ['Honest. I like honest. It’s rarer than coin in here.'] },
        ],
      },
    ],
    topics: [
      { id: 'hire', text: 'Is anyone here looking for work?', if: { candidateHere: true }, effects: [{ recruit: true }], lines: ['Them, at the tables. Talk to them yourself, love; I only pour.'] },
      { id: 'hire', text: 'Is anyone here looking for work?', lines: ['Not tonight. Strays come and go with the month. Try me again after the next wage day.'] },
      { id: 'news', text: 'What’s the talk in town?', if: { storyDone: 'm4' }, lines: ['Silver-and-grey types in the plaza, asking about your banner.', 'Nobody tells them anything. Dunmere doesn’t like being asked.'] },
      { id: 'news', text: 'What’s the talk in town?', if: { season: 'autumn' }, lines: ['The Harvest Melee, what else. Every kiln-boy thinks he’s a champion this month.'] },
      { id: 'news', text: 'What’s the talk in town?', lines: ['The Old Road’s gone bad. Wolfskins taking mules in daylight. Corwin won’t shut up about it.'] },
      { id: 'self', text: 'How long have you run the Wayfarer?', lines: ['Long enough to know which heroes come back. My husband didn’t.', 'So I listen when people tell stories about the woods.'] },
      { id: 'lantern', text: 'Did the Broken Lantern ever drink here?', if: { prologueDone: true }, effects: [{ codex: 'mara-fen' }], lines: ['Once. Seven of them, loud and broke, celebrating a win they hadn’t had yet.', 'Then they had it. Then they were gone. Drink up.'] },
    ],
    bye: { text: 'Thanks, Mara.', lines: ['Don’t thank me. Come back alive. It’s better for business.'] },
  },

  // Corwin Pell: brisk, a merchant to the bone; counts everything, even favours.
  'dunmere.merchant': {
    speaker: 'Corwin Pell',
    portrait: P('merchant'),
    variants: [
      // How they feel about the guild (its standing: fear, respect, disgust, warmth).
      { if: { talked: true, quadrant: 'fear' }, lines: ['Ah! Of course, of course. Whatever you need. No charge for looking.'] },
      { if: { talked: true, quadrant: 'respect' }, lines: ['My favourite guild, and the town’s too. People pay more for roads you’ve walked.'] },
      { if: { talked: true, quadrant: 'disgust' }, lines: ['Business is business. But I count my fingers after shaking your hand.'] },
      { if: { talked: true, quadrant: 'compassion' }, lines: ['You again! Half my drivers name their mules after your people now.'] },
      { if: { patronRival: 'trade' }, lines: ['Ah. You. The Trade House keeps two lists, and you’re on the other one now.'] },
      { if: { oldRoadCleared: true, talked: true }, lines: ['My guild of choice! The wagons run the Old Road every morning now. What can I do for you?'] },
      { if: { talked: true }, lines: ['Back again? Time is money, friend, and you’re holding some of mine.'] },
      {
        if: { charter: 'merchant' },
        lines: ['A Merchant House banner! Finally, a guild that reads the ledger before it draws a sword.', 'Corwin Pell, Trade House. Shall we talk business?'],
      },
      {
        lines: ['You there, with the banner. Got a moment? Moments are cheap; mine aren’t.', 'Corwin Pell, Trade House. I deal in wagons, wool and problems.'],
        choices: [
          { text: 'What kind of problems?', reply: ['The four-legged kind. Ask me properly and I’ll tell you.'] },
          { text: 'I’m listening.', reply: ['Good. Most guilds start by asking about pay. You’ll go far.'] },
        ],
      },
    ],
    topics: [
      { id: 'road', text: 'What’s wrong with the Old Road?', if: { oldRoadCleared: false }, effects: [{ flag: 'oldRoadIntroduced' }], lines: ['Wolfskins, raiders in wolf pelts, bold enough to take a mule in daylight. And somebody is paying them to hit my wagons.', 'The contract’s on the Notice Board, with the House seal.'] },
      { id: 'road', text: 'How are the wagons running?', if: { oldRoadCleared: true }, lines: ['On time, for once. The drivers toast your guild at every stop. Cheaply, but they do.'] },
      { id: 'way', text: 'Where is the Old Road?', lines: ['West, over the river bridge. Walk past the last kiln and keep going. You’ll hear them first.'] },
      ...TRADE,
    ],
    bye: { text: 'Good trading, Corwin.', lines: ['Always. Mind your purse on the way out; Dunmere is friendly, not honest.'] },
  },

  // Bram Calder: cocky, competitive; turns everything into a contest.
  'dunmere.fighter': {
    speaker: 'Bram Calder',
    portrait: 'portrait.story.bram',
    variants: [
      { if: { storyHero: 'bram' }, lines: ['Captain. Practising. Somebody in this guild has to look good in the ring.'] },
      { if: { choice: { bram: 'rival' }, storyDone: 'm4' }, lines: ['You again. Come to watch a real Duelist warm up? Take notes.'] },
      { if: { storyDone: 'm4' }, lines: ['Still carrying that banner? Brave or stupid. I haven’t decided which.'] },
      { if: { talked: true }, lines: ['Back for another lesson? I don’t charge. Yet.'] },
      {
        lines: ['Hey. You’re blocking my light. Fighters need light.', 'Bram Calder, best blade in Dunmere. You’ve heard of me. Everybody has.'],
        choices: [
          { text: 'Can’t say I have.', reply: ['You will. Ask anyone at the arena. Ask them twice.'] },
          { text: 'Best blade? Prove it.', effects: [{ relationship: 1 }], reply: ['Ha! I like you. The Harvest Melee. I’ll prove it there, in front of everybody.'] },
        ],
      },
    ],
    topics: [
      { id: 'advice', text: 'Any advice for a new guild?', if: { storyDone: 'm4' }, lines: ['Watch the feet, not the blade. Everybody lies with the blade.'] },
      { id: 'advice', text: 'Any advice for a new guild?', lines: ['Raiders circle. Don’t chase the one in front of you; watch the two beside it.'] },
      { id: 'melee', text: 'What’s the Harvest Melee?', lines: ['The best fight in western Valedorn, and the only one that matters this year.', 'Sign up at the arena. Then try not to meet me early.'] },
      { id: 'why', text: 'Why fight in tournaments at all?', lines: ['Because a guild picks you for your name. I mean to have the loudest one.'] },
    ],
    bye: { text: 'See you in the ring.', lines: ['You’ll see me. Whether you see me coming is another matter.'] },
  },

  // Gideon Rusk: gruff, money-minded, secretly decent; talks like a landlord.
  'dunmere.stablemaster': {
    speaker: 'Gideon Rusk',
    portrait: 'portrait.story.stablemaster',
    variants: [
      { if: { hallLeased: true, talked: true }, lines: ['My tenant. Roof holding? Fence standing? Rent paid? Then what do you want?'] },
      { if: { hallLeased: true }, lines: ['Ah, the new tenant. Everything holding up over there?'] },
      { if: { talked: true }, lines: ['You again. The yard’s still empty, and still mine.'] },
      {
        lines: ['Looking at my yard? Everybody looks. Nobody pays.', 'Gideon Rusk. That lot behind me is mine, cabin and all.'],
        choices: [
          { text: 'I might pay.', reply: ['Might. Ha. Come back when “might” becomes coin.'] },
          { text: 'It looks half-collapsed.', reply: ['Three-quarters standing. That’s a bargain in Dunmere.'] },
        ],
      },
    ],
    topics: [
      { id: 'yard', text: 'What’s the story with the yard?', lines: ['A stable, then a guild office, then nothing. The stable came down; the cabin didn’t.', 'Six good slots for buildings, if someone ever builds.'] },
      { id: 'rent', text: 'How much to rent it?', if: { hallLeased: false }, lines: ['A season up front, then monthly. Talk to me properly when you’re ready.'] },
      { id: 'sell', text: 'Would you ever sell it?', if: { hallLeased: true }, lines: ['For enough coin, I’d sell my own boots. Save up. You’ll know when it’s enough.'] },
    ],
    bye: { text: 'I’ll be seeing you, Gideon.', lines: ['Everyone does. Usually on rent day.'] },
  },

  // Nessa Thornfield before she joins: eager, guarded about her brother.
  'dunmere.nessa': {
    speaker: 'Nessa Thornfield',
    portrait: 'portrait.story.nessa',
    variants: [
      { if: { talked: true }, lines: ['Still here. Still patient. Mostly.'] },
      {
        lines: ['Oh! Sorry, I thought you were someone else. Someone with a job.', 'Nessa. Hunter. Guide. Currently very good at waiting.'],
        choices: [
          { text: 'What are you waiting for?', reply: ['A guild that’ll take me. Mara says be patient. I’ve been patient for two years.'] },
          { text: 'A hunter? What do you hunt?', reply: ['Deer, mostly. Lately I track Wolfskins: raiders who wear the pelts and bite harder.'] },
        ],
      },
    ],
    topics: [
      { id: 'guilds', text: 'Why won’t the guilds take you?', lines: ['Too young, too local, too stubborn. Pick one.'] },
      { id: 'thornwood', text: 'You know the Thornwood?', lines: ['Guided caravans through it since I was twelve. I know every path that doesn’t want to be found.'] },
      { id: 'family', text: 'Do you have family here?', lines: ['…Not here. Ask me something else.'] },
    ],
    bye: { text: 'Good luck, Nessa.', lines: ['I don’t need luck. I need a job. But thanks.'] },
  },

  // Iven Quill: a wandering rumour-seller; warm, talks in roads and weather.
  'dunmere.traveler': {
    speaker: 'Iven Quill',
    portrait: P('traveler'),
    variants: [
      { if: { talked: true, tierAtLeast: 1 }, lines: ['The promoted guild! I’ve been telling your story in three towns. I improve it a little each time.'] },
      { if: { talked: true }, lines: ['Back again? Your boots look older. Good. Boots should earn their scuffs.'] },
      {
        lines: ['Another traveler? You’ve got road dust on your boots.', 'Iven Quill. I walk the roads and sell what I hear. Where are you headed?'],
        choices: [
          { text: 'Nowhere yet. I’ve only just started a guild.', reply: ['A guild! Then learn the roads before they learn you.'] },
          { text: 'Wherever the work is.', reply: ['Spoken like a sellsword. The roads have plenty of work. Most of it bites.'] },
          { text: 'Wherever my boots stop complaining.', effects: [{ relationship: 1 }], reply: ['Then you’ll never leave Dunmere. Mine haven’t stopped in twenty years.'] },
        ],
      },
    ],
    topics: [
      { id: 'ironford', text: 'How do I get to Ironford?', effects: [{ rumor: { location: 'ironford', note: 'Follow the river east. You can hear the foundries before you see the walls.' } }], lines: ['Follow the river east. You’ll hear the foundries before you see the walls.'] },
      { id: 'greenhollow', text: 'And Greenhollow?', effects: [{ rumor: { location: 'greenhollow', note: 'North-east through the herb fields. Ask for the Elder Oak.' } }], lines: ['North-east through the herb fields. Ask anyone for the Elder Oak; they point like it’s family.'] },
      { id: 'news', text: 'Heard any news on the road?', if: { storyDone: 'm6' }, effects: [{ rumor: { location: 'windmere', note: 'An old champion on the cliffs who never lost.' } }], lines: ['Windmere’s full of talk about an old cliff champion. Never lost a duel, they say.', 'Never is a long time. I’d like to meet him.'] },
      { id: 'news', text: 'Heard any news on the road?', lines: ['Wolfskins on the Old Road, bold as merchants. Somebody’s paying them, if you ask me.'] },
      { id: 'self', text: 'You sell what you hear?', lines: ['A map is just a rumour someone wrote down. I just skip the writing.'] },
    ],
    bye: { text: 'Safe roads, Iven.', lines: ['And you. Mind the bridges; they remember who crossed them.'] },
  },

  // Orren Pike: pompous, theatrical, loves a name; speaks like a proclamation.
  'dunmere.herald': {
    speaker: 'Orren Pike',
    portrait: P('herald'),
    variants: [
      // How they feel about the guild (its standing: fear, respect, disgust, warmth).
      { if: { talked: true, quadrant: 'fear' }, lines: ['I’ve written your name in my book. I’d rather not write it again, for both our sakes.'] },
      { if: { talked: true, quadrant: 'respect' }, lines: ['The heralds speak well of {epithet}. I’m careful to say it correctly.'] },
      { if: { talked: true, quadrant: 'disgust' }, lines: ['I post the notices. I don’t have to like who reads them.'] },
      { if: { talked: true, quadrant: 'compassion' }, lines: ['Dunmere notices kindness. Slowly, but it notices. What can I do for you?'] },
      { if: { tierAtLeast: 1 }, lines: ['Hear ye! {guild}, promoted! I’ve written it on three boards and shouted it from the fountain. Twice.'] },
      { if: { talked: true, fameAtLeast: 40 }, lines: ['Ah, {guild}! Your name crossed my desk twice this week. A good start. Keep it coming.'] },
      { if: { talked: true }, lines: ['Back for news? Names are my trade, and business is brisk.'] },
      {
        lines: ['A new banner! Hear ye, hear ye. Well, I hear ye. What do they call you?'],
        choices: [
          { text: 'We’re {guild}.', reply: ['{guild}. I’ll remember it. Whether Dunmere does is up to you.'] },
          { text: 'Nobody calls us anything yet.', reply: ['Then let’s fix that. I am Orren Pike, the town’s herald. Names are my trade.'] },
        ],
      },
    ],
    topics: [
      { id: 'lantern', text: 'Who were the Broken Lantern?', if: { notFlag: 'heraldOfficial' }, effects: [{ flag: 'heraldOfficial' }, { codex: 'official-story' }], lines: ['A sad tale. Their captain bargained with the Hollow Warden for one great victory.', 'He won the Crownfall. Then the Warden came to collect. That is the official account.'] },
      { id: 'lantern', text: 'Who wrote the official account?', if: { flag: 'heraldOfficial' }, lines: ['The Argent Crown sent the letter. I read it out every year. It is very well written.'] },
      { id: 'fame', text: 'How does a guild earn a name?', effects: [{ open: 'herald' }], lines: ['Contracts finished, tournaments won, rivals beaten. Come inside; the ladders are on the wall.'] },
      { id: 'scholars', text: 'Got anything a scholar would want?', if: { charter: 'scholars' }, lines: ['A whole shelf of rumours nobody can prove. Borrow it any time. Return it slightly less true.'] },
    ],
    bye: { text: 'Thank you, Orren.', lines: ['Go forth! And do something worth shouting about.'] },
  },

  // Hesta Coal: blunt, warm, smells of smoke; everything is about fire and clay.
  'dunmere.kilnmaster': {
    speaker: 'Hesta Coal',
    portrait: P('kilnmaster'),
    variants: [
      { if: { season: 'autumn' }, lines: ['Harvest firing! Every kiln in Dunmere burns for the festival plates. Mind your sleeves.'] },
      { if: { talked: true }, lines: ['Back again? Stand upwind. The new batch is spitting.'] },
      {
        lines: ['You smell that? Good clay, wet wood and somebody’s ambition. Probably yours.', 'Hesta Coal. I fire half the pots in this town.'],
        choices: [
          { text: 'Only half?', reply: ['The other half are fired by fools. You can tell by the cracks.'] },
          { text: 'It smells like smoke to me.', reply: ['That’s ambition. Burns your eyes too.'] },
        ],
      },
    ],
    topics: [
      { id: 'errand', text: 'Need anything carried?', if: { notFlag: 'hestaParcel' }, effects: [{ item: { potion: 1 } }, { relationship: 1 }, { flag: 'hestaParcel' }], lines: ['Not today. Take this tonic for the road. It burns going down, which is how you know it works.'] },
      { id: 'ironford', text: 'Who buys your firebrick?', lines: ['Ironford smiths. If you’re heading east, they owe me a favour. Use my name.'] },
      { id: 'plates', text: 'What are the plates for?', lines: ['Banners, lanterns, wolves. Whatever the town is proud of, it wants on a plate.'] },
    ],
    bye: { text: 'Keep the fires going.', lines: ['Always do. Mind the step; it’s hotter than it looks.'] },
  },

  // Pip: a kid lamplighter; quick, nosy, knows everyone's routes.
  'dunmere.lamplighter': {
    speaker: 'Pip',
    portrait: P('lamplighter'),
    variants: [
      { if: { storyDone: 'm4' }, lines: ['You’re back! I keep my lamps lit extra long now. Since the lantern stories. Just in case.'] },
      { if: { talked: true }, lines: ['Hi again! Need someone found? I know where everybody walks after dark.'] },
      {
        lines: ['Are you the new banner? Everybody says you are. Are you?', 'I’m Pip. I light the plaza lamps.'],
        choices: [
          { text: 'I am. What do they say about us?', reply: ['That you’re brave. Or broke. Mostly broke.'] },
          { text: 'Depends who’s asking.', reply: ['Me! I’m asking. I already said.'] },
        ],
      },
    ],
    topics: [
      { id: 'who', text: 'Who should I meet in town?', lines: ['Corwin, by the Notice Board, has a job. Mara at the Wayfarer knows who wants one.'] },
      {
        id: 'notices',
        text: 'Someone tears down the herald’s notices at night. You’re out at night.',
        if: { storyStep: 'e5-notices.look' },
        effects: [{ flag: 'noticesFound' }],
        lines: ['…Only the silver-and-grey ones. The Argent Crown’s recruiting notices.', 'They took my brother for their levy. He never wrote. I won’t have them taking anyone else’s.'],
      },
      { id: 'night', text: 'Seen anything odd at night?', if: { prologueDone: true }, lines: ['Men in grey boots on Kiln Row, the night of the knocking. They walked like soldiers.'] },
      { id: 'lamps', text: 'How many lamps do you light?', lines: ['Forty-two. Forty-three if you count the one that never stays lit.'] },
    ],
    bye: { text: 'See you around, Pip.', lines: ['I’ll see you first. I always do.'] },
  },

  // Places and things: described, not spoken to.
  'dunmere.fountain': {
    speaker: 'The Banner Fountain',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [
      {
        lines: ['Bronze banners ring the basin, one for every guild Dunmere has raised. One pole stands empty.', 'Someone has scratched “for the Lantern” on the rim.'],
        choices: [{ text: 'Toss in a coin for luck', if: { goldAtLeast: 1, notFlag: 'fountainCoin' }, effects: [{ gold: -1 }, { flag: 'fountainCoin' }], reply: ['The coin sinks next to a hundred others. It feels like joining something.'] }],
      },
    ],
  },
  'dunmere.well': {
    speaker: 'Old well',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['The water is cold and tastes of iron. Ironford is upstream, they say.'] }],
  },
  'dunmere.kiln': {
    speaker: 'Hesta’s kiln',
    portrait: 'portrait.poi',
    leave: 'Move on',
    variants: [{ lines: ['A beehive kiln, still warm. Stamped plates cool on the racks: a banner, a lantern, a wolf.'] }],
  },
};
