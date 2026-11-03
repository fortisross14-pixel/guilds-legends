// @ts-check
// Shared JSDoc types for the engine. Import with:
//   /** @typedef {import('../types.js').GameState} GameState */
// These describe the persisted save shape. Most fields are loose on purpose:
// the engine evolved organically and saves from older versions are migrated.

/**
 * @typedef {Object} Rng
 * @property {() => number} next
 * @property {(min: number, max: number) => number} int
 * @property {<T>(list: T[]) => T} pick
 * @property {(probability: number) => boolean} chance
 * @property {() => number} getState
 */

/**
 * @typedef {Object} HeroCareer
 * @property {number} missions
 * @property {number} wins
 * @property {number} titles
 * @property {number} [individualTitles]
 * @property {number} [guildTitles]
 * @property {number} serviceYears
 * @property {number} [leadershipYears]
 * @property {number} peakPower
 * @property {Record<string, number>} [titleWins]
 * @property {any} [bestMission]
 */

/**
 * A player, rival, free-agent or candidate hero.
 * @typedef {Object} Hero
 * @property {string} id
 * @property {string} name
 * @property {string} classId
 * @property {string} primal
 * @property {string} rarity
 * @property {number} level
 * @property {number} xp
 * @property {number} age
 * @property {number} power
 * @property {number} potential
 * @property {Record<string, number>} attributes
 * @property {string} status 'available' | 'mission' | 'tournament' | 'injured' | 'dead' | 'retired' | 'candidate' | 'active' | 'free-agent'
 * @property {string | null} guildId 'player', a rival id, or null for free agents
 * @property {number} loyalty
 * @property {number} morale
 * @property {number} form
 * @property {number} fatigue
 * @property {number} health
 * @property {number} salary
 * @property {number} renown
 * @property {number} legacy
 * @property {string} [homeLocationId]
 * @property {string} [monthlyActivity]
 * @property {string} [training]
 * @property {string | null} [appointment]
 * @property {string | null} [branchId]
 * @property {string | null} [mentorId]
 * @property {string[]} [apprenticeIds]
 * @property {any[]} [promises]
 * @property {any[]} [relationships]
 * @property {any[]} [ambitions]
 * @property {string[]} [artifactIds]
 * @property {HeroCareer} career
 * @property {any[]} history
 * @property {Record<string, number>} [specializations]
 */

/**
 * @typedef {Object} PatronLoan
 * @property {number} remaining
 * @property {number} installment
 * @property {number} takenYear
 * @property {number} takenMonth
 */

/**
 * The player guild.
 * @typedef {Object} Guild
 * @property {'player'} id
 * @property {string} name
 * @property {string} founder
 * @property {string | null} founderHeroId
 * @property {string | null} currentGuildmasterHeroId
 * @property {string | null} successorHeroId
 * @property {number} tierIndex 0 Regional, 1 National, 2 Global
 * @property {string} tier
 * @property {number} fame
 * @property {number} legacy
 * @property {number} crowns gold
 * @property {number} rank
 * @property {boolean} fallen
 * @property {PatronLoan | null} loan
 * @property {number} unpaidMonths
 * @property {{ owned: boolean, lease: boolean, houseBeds: number, rooms: Record<string, number>, construction: { roomId: string, level: number, weeksLeft: number, totalWeeks: number } | null }} hall  the guild's home (src/data/rooms.js)
 * @property {Record<string, string>} appointments
 * @property {Record<string, any[]>} formations
 * @property {any[]} branches
 * @property {string} charter  founding charter id (src/data/charters.js)
 */

/**
 * A contract on the board, or a deployed one in activeMissions.
 * @typedef {Object} Mission
 * @property {string} id
 * @property {string} templateId
 * @property {string} title
 * @property {string} family
 * @property {string} locationId
 * @property {number} risk
 * @property {number} difficulty
 * @property {number} duration months
 * @property {number} [remaining] months left (active missions only)
 * @property {string} [formationType]
 * @property {{ heroId: string, slotId: string, role: string }[]} [assignments]
 */

/**
 * An individual or guild tournament for the current year.
 * @typedef {Object} Tournament
 * @property {string} id
 * @property {string} definitionId
 * @property {string} name
 * @property {number} year
 * @property {number} month
 * @property {string} locationId
 * @property {string} status 'scheduled' | 'active' | 'complete'
 * @property {string | null} [playerHeroId]
 * @property {any[]} [entrants]
 */

/**
 * An AI guild with a star and a supporting roster.
 * @typedef {Object} Rival
 * @property {string} id
 * @property {string} name
 * @property {number} tierIndex
 * @property {number} [leagueTierIndex]
 * @property {string} homeLocationId
 * @property {number} fame
 * @property {number} legacy
 * @property {Hero} star
 * @property {Hero[]} members
 */

/**
 * The whole campaign save. See CLAUDE.md for a field-by-field summary.
 * @typedef {Object} GameState
 * @property {number} schemaVersion
 * @property {string} id
 * @property {number} seed
 * @property {number} rngState
 * @property {{ year: number, month: number }} date
 * @property {Guild} guild
 * @property {{ currentLocationId: string, visitedLocationIds: string[], activeTravel: any }} world
 * @property {Hero[]} heroes
 * @property {Hero[]} historicHeroes
 * @property {Hero[]} candidates
 * @property {Rival[]} rivals
 * @property {Hero[]} freeAgents
 * @property {Hero[]} worldHistoricHeroes
 * @property {Mission[]} missions
 * @property {Mission[]} activeMissions
 * @property {any} activeEncounter
 * @property {any} activeMissionGame
 * @property {any[]} pendingDecisions
 * @property {any[]} pendingReports
 * @property {Tournament[]} tournaments
 * @property {Tournament[]} guildTournaments
 * @property {any[]} tournamentHistory
 * @property {any[]} missionHistory
 * @property {Record<string, any>} titleRecords
 * @property {any[]} chronicle
 * @property {any[]} artifacts
 * @property {any[]} worldArtifacts
 * @property {any[]} sagas
 * @property {any[]} goals
 * @property {any[]} achievements
 * @property {Record<string, number>} stats
 * @property {any} legacy
 * @property {any} tutorial
 * @property {any} council
 * @property {any[]} notifications
 * @property {any} settings
 * @property {Record<string, any>} flags
 * @property {Record<string, any>} universeStats
 */

/**
 * Most engine actions return the next state plus an error message.
 * On error, `state` is the unchanged input.
 * @typedef {{ state: GameState, error: string | null }} EngineResult
 */

export {};
