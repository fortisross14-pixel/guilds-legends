// Choices every patron representative offers: how the patron sees you (by
// standing) and a monthly gift. `voice` holds the lines for each standing.

export function patronChoices(patronId, name, voice) {
  return [
    { text: `How does the ${name} see us?`, if: { patronAtLeast: { [patronId]: 'ally' } }, reply: [voice.ally] },
    { text: `How does the ${name} see us?`, if: { patronAtLeast: { [patronId]: 'partner' }, patronBelow: { [patronId]: 'ally' } }, reply: [voice.partner] },
    { text: `How does the ${name} see us?`, if: { patronAtLeast: { [patronId]: 'contact' }, patronBelow: { [patronId]: 'partner' } }, reply: [voice.contact] },
    { text: `How does the ${name} see us?`, if: { patronBelow: { [patronId]: 'contact' } }, reply: [voice.stranger] },
    { text: `A gift for the ${name} (50 G)`, if: { patronGiftReady: patronId }, effects: [{ patronGift: patronId }], reply: [voice.gift] },
  ];
}
