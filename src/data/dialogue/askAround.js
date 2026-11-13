// "Ask around" story steps (docs/design/STORY_DRAFT.md): while the step is current, everyone
// in the town can be asked the question. Most only know the outline; after a few people
// (how many depends on the campaign's seed) someone points the guild to the one who knows.
// The one who knows has their own scene (the step's `npc`), and can be found first by luck.
// Keyed by '<missionId>.<stepId>'. `lines` are picked by who is asked; `pointer` is the hint.
export const ASK_AROUND = {
  'c1-ask.ask': {
    locationId: 'dunmere',
    text: 'Do you remember the Broken Lantern?',
    // The hint comes from the 2nd to the 4th person asked.
    after: [2, 4],
    pointer: ['Old Ebb might. He sits in the Wayfarer every night, and he drank with half the guilds that came through.', 'Buy him a beer and he won’t stop talking.'],
    lines: [
      ['The Lantern? A little guild that won something big, then went into the Blackwood and never came out.'],
      ['Cursed, the heralds said. Their captain sold his luck to something in the woods.'],
      ['Before my time. I remember the banners coming down, that’s all.'],
      ['They beat the Argent Crown once. Nobody beats the Crown. Then they were gone.'],
      ['Don’t say that name too loud. People who did found their customers going elsewhere.'],
      ['Seven of them, I think. Or eight. Nobody counts the dead right.'],
      ['I sold one of them a cloak once. Paid in silver and didn’t haggle. That’s all I know.'],
      ['Ask the herald. Then ignore what he tells you; he reads what he’s given.'],
    ],
  },
};
