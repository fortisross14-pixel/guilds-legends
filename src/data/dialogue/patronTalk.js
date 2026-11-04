// Topics every patron representative offers in their hub: how the patron sees
// the guild (one answer per standing) and a monthly gift. `voice` holds each
// answer as lines in the representative's own voice. `name` is how the player
// says it ("the Trade House").

export function patronTopics(patronId, name, voice) {
  const ask = `Where do we stand with ${name}?`;
  return [
    { id: 'standing', text: ask, if: { patronAtLeast: { [patronId]: 'ally' } }, lines: voice.ally },
    { id: 'standing', text: ask, if: { patronAtLeast: { [patronId]: 'partner' }, patronBelow: { [patronId]: 'ally' } }, lines: voice.partner },
    { id: 'standing', text: ask, if: { patronAtLeast: { [patronId]: 'contact' }, patronBelow: { [patronId]: 'partner' } }, lines: voice.contact },
    { id: 'standing', text: ask, if: { patronBelow: { [patronId]: 'contact' } }, lines: voice.stranger },
    { id: 'gift', text: `Please accept a gift for ${name}. (50 gold)`, if: { patronGiftReady: patronId }, effects: [{ patronGift: patronId }], lines: voice.gift },
  ];
}
