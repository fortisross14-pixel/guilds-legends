---
name: user-flows
description: Design, map, and audit user flows — task flows, wireflows, journey maps, service blueprints, flow notation, entry points, decision points, branch and error paths, and full state coverage (empty, loading, partial, error, offline, permission, success). Use when mapping a feature before designing screens, auditing an existing flow for gaps, planning onboarding/auth/checkout/deletion/upgrade flows, deciding what screens are needed, or when a design covers the happy path and nothing else.
---

# User Flows

A flow is the sequence of steps, decisions, and system responses between a user's intent and its resolution. Flow work is where most usability defects are *prevented*, because the majority of real-world defects live in the paths nobody drew: the error branch, the empty state, the interrupted session, the second-time user.

## The rule that matters most

**Draw the unhappy paths before drawing any screens.** A flow diagram that shows only the success path is not a flow diagram; it's an illustration. Most teams' design debt is entirely in the branches they skipped, and those branches are cheap to find on paper and expensive to find in production.

## Pick the right artifact

These get conflated constantly. They answer different questions and are not interchangeable.

| Artifact | Answers | Shows | Use when |
|---|---|---|---|
| **Task flow** | What are the steps? | One linear path, no branching, no UI | Scoping a simple, single-path task |
| **User flow** | What are the paths and decisions? | Branches, decisions, system responses, error paths | Designing or auditing a feature — **the default** |
| **Wireflow** | What does each step look like? | Low-fi screens connected by transitions | Communicating to engineering; reviewing a specific design |
| **Screen-state diagram** | What states can this screen be in? | All states of one screen and transitions between them | Complex single screens; component design |
| **Journey map** | How does this feel over time? | Phases, actions, thoughts, emotions, pain points, across channels | Strategy; finding where to invest; cross-channel problems |
| **Service blueprint** | What has to happen behind the scenes? | Journey plus frontstage, backstage, and support processes, with a line of visibility | Operational services; anything with humans in the loop |
| **Experience map** | What's the whole context? | The user's broader behavior, product-agnostic | Discovery; before you know what to build |

**Common mistake:** using a journey map to design a feature. Journey maps operate at the wrong altitude — they're for finding *where* the problem is, not for specifying what to build. Once you know where, switch to a user flow.

Full notation and conventions: `references/notation-and-artifacts.md`.

## Building a flow

**1. Name the actor and the trigger.** Who, in what state (new/returning/expired/invited), arriving from where. A flow with an unnamed actor drifts.

**2. State the goal in the user's terms**, and the success condition in observable terms. "The report is scheduled and they know when it will send" — not "they complete the schedule form."

**3. List every entry point.** This is the most-skipped step and a top source of bugs. Direct URL, deep link, email link, notification, search result, in-app navigation, back-navigation, refresh mid-flow, a shared link from someone else, a bookmark, resuming after a session expiry. Each entry point may arrive with different state and different context, and the flow must handle all of them.

**4. Map the happy path** — the shortest route from trigger to success.

**5. Map every decision point.** At each one: what are the branches, what determines the branch, and what's the default? Watch for decisions that are *system* decisions presented as *user* decisions — those should usually be defaults.

**6. Map the unhappy paths.** For each step: what can fail, what can be missing, what can be slow, what can be interrupted. See the state checklist below.

**7. Map exits.** Every step needs an answer to: can they go back, can they cancel, what's preserved if they leave, what happens if they close the tab?

**8. Mark the peak and the end.** Where is the emotional high or low point, and what is the final moment? Design both deliberately (peak-end rule).

## The state coverage checklist

Run this on **every screen** in the flow. It's the highest-yield audit in this entire repo — most teams design one state per screen and ship seven bugs.

- [ ] **Empty** — nothing yet, first time. Does it explain what goes here and how to start?
- [ ] **Empty — user cleared it** — different from first-time empty. Don't show onboarding to someone who just deleted everything.
- [ ] **Loading** — first load, and reload with stale content shown.
- [ ] **Partial** — some data loaded, some pending or failed.
- [ ] **Ideal** — the typical, populated case.
- [ ] **Sparse** — one item. Does the layout collapse?
- [ ] **Overflow** — 10,000 items. Long strings, long names, no word breaks, deep nesting.
- [ ] **Error — recoverable** — validation, conflict, retry available.
- [ ] **Error — unrecoverable** — server down, permission revoked. Where does the user go?
- [ ] **Offline / degraded** — what works, what queues, what's honestly disabled.
- [ ] **Permission denied** — not authorized. Does it explain and offer a route?
- [ ] **Not found / deleted** — the resource is gone, or was never theirs.
- [ ] **Stale** — someone else changed it while they were looking.
- [ ] **Success** — and does it say what happens next?
- [ ] **In progress / pending** — the action was accepted but isn't done.
- [ ] **Disabled** — and does it explain *why*?

Details and treatment for each: `references/states-and-edges.md`.

## Canonical flows

Most flows you'll design are variations on a small set of well-understood ones. Don't reinvent — start from the known-good structure and its known failure points. `references/canonical-flows.md` covers: onboarding/activation, sign-up and sign-in, password reset, invite and team join, checkout and payment, subscription upgrade/downgrade/cancel, search and filter, create-edit-save, deletion, sharing and permissions, import and bulk upload, and settings.

## Flow smells

Fast diagnostics when reviewing a flow someone else drew:

- **No error branches.** The most common and most serious.
- **A step with one exit.** Users can enter but not leave or go back.
- **A decision with no default.** Every decision point should have an answer for the user who doesn't care.
- **Data collected before it's needed.** Fields asked at step 1 that aren't used until step 5, or ever.
- **A dead end.** A terminal state with no next action — especially error and success screens.
- **A loop with no escape.** Verify → fails → verify → fails, with no path to support.
- **More steps to leave than to enter.** Signup 2 steps, cancellation 7. This is an obstruction pattern (see `design-psychology`).
- **Silent state change.** The system does something consequential without telling the user.
- **A required step the user can't complete** — needs information they don't have, or a permission they lack.
- **Context loss on any hop** — sending someone to email, to a doc, to a payment provider, and losing their place on return.
- **Un-linkable state.** No URL for a state a user would want to bookmark or share.
- **Different behavior for the second time through**, unconsidered.

Full audit procedure and a scoring rubric: `references/flow-quality-checklist.md`.

## Reference files

- `references/notation-and-artifacts.md` — notation conventions, symbols, swimlanes, how to draw each artifact type
- `references/canonical-flows.md` — the standard flows with structure, decision points, and known failure modes
- `references/states-and-edges.md` — every state, what it should contain, and how to design it
- `references/flow-quality-checklist.md` — audit procedure, review rubric, common defects
