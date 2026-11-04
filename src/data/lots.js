// Lots: the land a guild builds its hall on (Phase 7D). A lot is rented first
// (no expansion while rented), can be bought outright for a price that takes
// years of saving, and once owned can grow by buying the land next door, step
// by step. Each built room takes one slot.
//
// Several lots in several cities are supported (bigger lots elsewhere come in
// Chapter 2); the guild's headquarters is one of them (state.guild.hqLotId).
// Moving headquarters to another lot is a later feature: the model allows it.
//
// A lot: { id, locationId, name, owner, slots, rent (gold a month while rented),
//   deposit (paid when renting), price (to buy it outright), starter (rooms
//   already standing: [{ type, tier }]), expansions: [{ slots, cost, weeks, land }] }

export const LOTS = [
  {
    id: 'dunmere-plaza',
    locationId: 'dunmere',
    name: 'The old stable yard on Banner Plaza',
    owner: 'Gideon Rusk',
    slots: 6,
    rent: 35,
    deposit: 160,
    // Several years of a young guild's savings.
    price: 6000,
    // A small cabin in the middle of the yard: one bedroom with two beds.
    starter: [{ type: 'bedroom', tier: 1 }],
    expansions: [
      { slots: 8, cost: 3500, weeks: 6, land: 'the cooper’s yard next door' },
      { slots: 10, cost: 6500, weeks: 10, land: 'the old tannery lot behind the yard' },
    ],
  },
];

export const LOT_BY_ID = Object.fromEntries(LOTS.map((lot) => [lot.id, lot]));

/** The lot story mission 1 ("A Banner Without a Hall") rents. */
export const HOME_LOT_ID = 'dunmere-plaza';
