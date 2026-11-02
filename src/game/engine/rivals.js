// @ts-check
// Rival guild seasons, the AI transfer market and rival institutional events.
import { addChronicle, clamp, clone, compactHero, ensureTournamentCareer, uid } from './core.js';
import { generateHero } from './heroes.js';
import { heroCompetitionTier } from './tournaments.js';

export function simulateRivals(state, rng) {
  state.rivals.forEach((rival) => {
    rival.seasonPoints ||= 0;
    rival.careerPoints ||= 0;
    rival.prizeMoney ||= 0;
    const roster = [rival.star, ...(rival.members || [])].filter(Boolean);
    const activityChance = 0.48 + rival.risk * 0.3;
    if (rng.chance(activityChance)) {
      const participant = rng.chance(0.52) ? rival.star : rng.pick(roster);
      ensureTournamentCareer(participant);
      const difficulty = 47 + rival.tierIndex * 11 + rng.int(-8, 13);
      const effective =
        rival.power + rival.form * 0.12 + (participant.specializations?.missions || 0) * 0.7 + (rival.strategy === 'spend' ? 4 : 0) + rng.int(-9, 9);
      const winChance = clamp(1 / (1 + Math.exp(-(effective - difficulty) / 10)), 0.12, 0.9);
      const won = rng.chance(winChance);
      participant.career.missions += 1;
      if (won) {
        const fameGain = rng.int(3, 9) + rival.tierIndex * 2;
        rival.fame += fameGain;
        rival.legacy += Math.max(1, Math.round(fameGain * 0.4));
        rival.crowns += rng.int(90, 300) * (rival.tierIndex + 1);
        rival.wins += 1;
        rival.seasonPoints += 3 + rival.tierIndex;
        rival.careerPoints += 2 + rival.tierIndex;
        rival.form = clamp(rival.form + rng.int(1, 4), 35, 90);
        participant.renown += rng.int(1, 3);
        participant.career.wins += 1;
        participant.career.earnings += rng.int(30, 100) * (rival.tierIndex + 1);
        participant.specializations.missions = clamp((participant.specializations?.missions || 0) + (rng.chance(0.2) ? 1 : 0), 0, 15);
      } else {
        rival.losses += 1;
        rival.form = clamp(rival.form - rng.int(1, 5), 25, 90);
        rival.crowns -= rng.int(35, 140);
        participant.career.defeats += 1;
        rival.seasonPoints = Math.max(0, rival.seasonPoints - 1);
        if (rng.chance(0.025 * rival.risk)) {
          addChronicle(state, {
            type: 'rival',
            importance: 2,
            title: `${rival.name} returns bloodied`,
            text: `${participant.name} survives a disastrous contract that weakens the guild’s standing.`,
            guildIds: [rival.id],
            heroIds: [participant.id],
            tags: ['rival', 'defeat'],
          });
        }
      }
    }
    rival.crowns -= 25 + rival.tierIndex * 15;
    rival.power = Math.round(
      roster
        .sort((a, b) => b.power - a.power)
        .slice(0, 5)
        .reduce((sum, hero) => sum + hero.power, 0) / Math.max(1, Math.min(5, roster.length)),
    );
    if (rival.crowns < -500) rival.fallen = true;
    if (rival.fallen && rival.crowns > 300) rival.fallen = false;
    // Rival institutions keep their league identity stable. Their results,
    // rosters and rankings change, but a familiar Regional opponent does not
    // disappear from the ladder simply because its fame has grown.
    rival.tierIndex = rival.leagueTierIndex ?? rival.tierIndex;
  });
}

export function runAiTransferMarketInPlace(state, rng) {
  const freeAgents = [...(state.freeAgents || [])]
    .filter((hero) => hero.status === 'free-agent')
    .sort(
      (a, b) => b.power + b.level * 1.7 + (b.specializations?.tournament || 0) * 1.4 - (a.power + a.level * 1.7 + (a.specializations?.tournament || 0) * 1.4),
    );
  let signings = 0;
  const signedIds = new Set();
  const released = [];

  for (const candidate of freeAgents) {
    if (signings >= 5) break;
    const candidateTier = heroCompetitionTier(state, candidate);
    const suitors = state.rivals
      .filter((guild) => (guild.leagueTierIndex ?? guild.tierIndex) >= candidateTier)
      .map((guild) => {
        const members = guild.members || [];
        const weakest = [...members].sort((a, b) => a.power + (a.specializations?.tournament || 0) - (b.power + (b.specializations?.tournament || 0)))[0];
        const fit = guild.specialty === candidate.classId ? 8 : 0;
        const need = weakest ? candidate.power - weakest.power : 12;
        return { guild, weakest, score: need + fit + rng.int(-4, 6) };
      })
      .filter((row) => !row.weakest || row.score >= 5)
      .sort((a, b) => b.score - a.score);
    if (!suitors.length) continue;
    const { guild, weakest } = suitors[0];
    if (weakest) {
      guild.members = guild.members.filter((hero) => hero.id !== weakest.id);
      if ((weakest.age || 24) < 36) {
        weakest.guildId = null;
        weakest.status = 'free-agent';
        released.push(weakest);
      } else {
        weakest.status = 'retired';
        weakest.retiredYear = state.date.year;
        if ((weakest.career?.titles || 0) > 0 || weakest.legacy >= 90) state.worldHistoricHeroes.push(compactHero(weakest));
      }
    }
    candidate.guildId = guild.id;
    candidate.status = 'active';
    candidate.homeLocationId = guild.homeLocationId;
    guild.members.push(candidate);
    guild.recent = [...(guild.recent || []).slice(-8), `${candidate.name} joined from the open circuit.`];
    signedIds.add(candidate.id);
    signings += 1;
    if (candidate.rarity === 'Legend' || candidate.renown >= 150) {
      addChronicle(state, {
        type: 'transfer',
        importance: 2,
        title: `${guild.name} signs ${candidate.name}`,
        text: `The ${candidate.rarity.toLowerCase()} ${candidate.classId.toLowerCase()} leaves the open circuit for a permanent banner.`,
        heroIds: [candidate.id],
        guildIds: [guild.id],
        tags: ['rival', 'transfer'],
      });
    }
  }

  state.freeAgents = state.freeAgents.filter((hero) => !signedIds.has(hero.id));
  for (const hero of released) {
    if (!state.freeAgents.some((candidate) => candidate.id === hero.id)) state.freeAgents.push(hero);
  }
}

export function simulateRivalInstitutionsInPlace(state, rng) {
  state.legacy ||= { inheritedAmbitions: [], successionHistory: [], rivalInstitutionEvents: [] };
  const rivalEventsBefore = (state.stats.rivalPoaches || 0) + (state.stats.rivalSplits || 0);
  // Poaching creates memorable transfers between established guilds without making rosters chaotic.
  if (state.rivals.length && rng.chance(0.38)) {
    const targets = state.rivals.filter((guild) => guild.members?.length >= 4).sort((a, b) => a.fame - b.fame);
    const source = targets.slice(0, Math.max(1, Math.ceil(targets.length / 2)))[rng.int(0, Math.max(0, Math.ceil(targets.length / 2) - 1))];
    const suitors = state.rivals.filter((guild) => guild.id !== source?.id && guild.fame > (source?.fame || 0) * 1.25).sort((a, b) => b.crowns - a.crowns);
    const destination = suitors[0];
    const poachable = source?.members
      ?.filter((hero) => !['dead', 'retired'].includes(hero.status))
      .sort(
        (a, b) =>
          (b.rarity === 'Legend' ? 4 : b.rarity === 'Epic' ? 3 : b.rarity === 'Rare' ? 2 : 1) -
          (a.rarity === 'Legend' ? 4 : a.rarity === 'Epic' ? 3 : a.rarity === 'Rare' ? 2 : 1),
      )[0];
    if (source && destination && poachable && rng.chance(0.5)) {
      source.members = source.members.filter((hero) => hero.id !== poachable.id);
      poachable.guildId = destination.id;
      destination.members.push(poachable);
      destination.crowns -= 300 + poachable.level * 35;
      source.relationship = clamp((source.relationship || 0) - 10, -100, 100);
      destination.relationship = clamp((destination.relationship || 0) - 5, -100, 100);
      state.stats.rivalPoaches = (state.stats.rivalPoaches || 0) + 1;
      const event = { year: state.date.year, type: 'poach', sourceGuildId: source.id, destinationGuildId: destination.id, heroId: poachable.id };
      state.legacy.rivalInstitutionEvents.unshift(event);
      addChronicle(state, {
        type: 'transfer',
        importance: poachable.rarity === 'Legend' || poachable.rarity === 'Epic' ? 4 : 2,
        title: `${poachable.name} defects to ${destination.name}`,
        text: `${source.name} loses one of its established heroes to a richer rival.`,
        heroIds: [poachable.id],
        guildIds: [source.id, destination.id],
        tags: ['rival', 'poaching'],
      });
    }
  }

  // Strong internal factions occasionally split off. Cap total guilds so century saves remain readable.
  if (state.rivals.length < 36 && rng.chance(0.12)) {
    const parent = [...state.rivals].filter((guild) => guild.members?.length >= 6 && guild.fame >= 80).sort((a, b) => b.members.length - a.members.length)[0];
    if (parent && rng.chance(0.45)) {
      const defectors = parent.members.splice(-2);
      if (defectors.length === 2) {
        const leader = defectors.sort((a, b) => b.power - a.power)[0];
        const newId = uid('rival-split', rng);
        const newName = `${leader.name.split(' ')[0]} ${rng.pick(['Company', 'Covenant', 'Banner', 'Brotherhood', 'Circle'])}`;
        defectors.forEach((hero) => {
          hero.guildId = newId;
        });
        const newGuild = {
          ...clone(parent),
          id: newId,
          name: newName,
          motto: `No inheritance without a challenge.`,
          founded: state.date.year,
          fame: Math.max(25, Math.round(parent.fame * 0.28)),
          legacy: Math.max(10, Math.round(parent.legacy * 0.16)),
          crowns: 900 + rng.int(0, 1800),
          wins: 0,
          losses: 0,
          titles: 0,
          prizeMoney: 0,
          seasonPoints: 0,
          careerPoints: 0,
          hostility: rng.int(15, 55),
          relationship: 0,
          star: leader,
          members: defectors.filter((hero) => hero.id !== leader.id),
          recent: [`Split from ${parent.name} in ${state.date.year}.`],
          fallen: false,
        };
        while (newGuild.members.length < 4) {
          const replacement = ensureTournamentCareer(
            generateHero(state, rng, parent.tierIndex === 2 ? 'veteran' : 'normal', { guildId: newId, homeLocationId: parent.homeLocationId }),
          );
          replacement.status = 'active';
          newGuild.members.push(replacement);
        }
        parent.fame = Math.max(10, Math.round(parent.fame * 0.88));
        state.rivals.push(newGuild);
        state.stats.rivalSplits = (state.stats.rivalSplits || 0) + 1;
        state.legacy.rivalInstitutionEvents.unshift({ year: state.date.year, type: 'split', parentGuildId: parent.id, newGuildId: newId, leaderId: leader.id });
        addChronicle(state, {
          type: 'rival',
          importance: 4,
          title: `${newName} breaks away from ${parent.name}`,
          text: `${leader.name} leads a faction out beneath a new banner. The regional order changes overnight.`,
          heroIds: [leader.id],
          guildIds: [parent.id, newId],
          tags: ['rival', 'split', 'founding'],
        });
      }
    }
  }
  // If the universe has somehow remained perfectly static for several years,
  // force a single memorable transfer so long campaigns still develop rival history.
  if (
    (state.stats.rivalPoaches || 0) + (state.stats.rivalSplits || 0) === rivalEventsBefore &&
    rivalEventsBefore === 0 &&
    (state.stats.yearsPlayed || 0) >= 4 &&
    state.rivals.length >= 2
  ) {
    const source = [...state.rivals].filter((guild) => guild.members?.length >= 4).sort((a, b) => a.fame - b.fame)[0];
    const destination = [...state.rivals].filter((guild) => guild.id !== source?.id).sort((a, b) => b.fame + b.crowns * 0.01 - (a.fame + a.crowns * 0.01))[0];
    const poachable = source?.members?.filter((hero) => !['dead', 'retired'].includes(hero.status)).sort((a, b) => b.power - a.power)[0];
    if (source && destination && poachable) {
      source.members = source.members.filter((hero) => hero.id !== poachable.id);
      poachable.guildId = destination.id;
      destination.members.push(poachable);
      state.stats.rivalPoaches = (state.stats.rivalPoaches || 0) + 1;
      state.legacy.rivalInstitutionEvents.unshift({
        year: state.date.year,
        type: 'poach',
        sourceGuildId: source.id,
        destinationGuildId: destination.id,
        heroId: poachable.id,
        forced: true,
      });
      addChronicle(state, {
        type: 'transfer',
        importance: 3,
        title: `${poachable.name} changes banners`,
        text: `${destination.name} lures a proven rival hero away, ensuring the circuit never stays static for long.`,
        heroIds: [poachable.id],
        guildIds: [source.id, destination.id],
        tags: ['rival', 'poaching'],
      });
    }
  }
  state.legacy.rivalInstitutionEvents = state.legacy.rivalInstitutionEvents.slice(0, 80);
}
