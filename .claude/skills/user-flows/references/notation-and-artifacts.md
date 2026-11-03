# Flow Notation and Artifacts

## Notation

Use a small, consistent vocabulary. A flow anyone has to decode is a flow nobody reads.

| Symbol | Means | Notes |
|---|---|---|
| **Rounded rectangle** | Start / End (terminal) | Every flow has exactly one start and *several* ends — success, abandonment, error exits |
| **Rectangle** | A screen or a user action | Pick one convention and hold it. Recommended: rectangle = screen, and label user actions on the arrows |
| **Diamond** | Decision point | Must have ≥2 labeled outgoing edges. Label the condition, not the answer |
| **Parallelogram** | Input / output (data entered or shown) | Optional; useful in data-heavy flows |
| **Cylinder** | Data store / system record | Use when persistence matters to the story |
| **Hexagon** | System process (no UI) | API call, calculation, queue |
| **Dashed arrow** | Asynchronous / deferred | Email sent, webhook, background job |
| **Dotted box** | Out of scope / another system | Payment provider, SSO, email client |
| **Red/marked edge** | Error path | Mark them visibly. If your diagram has no red, it's incomplete |

**Arrow labels carry the information.** An unlabeled arrow out of a diamond is a bug in the diagram. Label the *condition*: "no payment method on file", not "no".

**Conventions worth adopting:**
- **Flow left-to-right for progress, top-to-bottom for depth.** Consistency beats any particular choice.
- **Number the steps** (1, 1.1, 1.2) so people can reference them in review comments and tickets.
- **One decision per diamond.** Compound conditions ("logged in AND verified AND has payment") hide branches — split them.
- **Show system responses, not just user actions.** A flow of only user actions omits half the interaction and all of the evaluation gulf.
- **Keep one flow to one goal.** If the diagram needs a legend with six colors, it's several flows.

## Swimlanes

Use horizontal lanes when more than one actor or system participates. Lanes make handoffs visible — and **handoffs are where flows break**.

Typical lanes: **User** / **Interface** / **System (backend)** / **Third party** / **Other humans (support, admin, approver)**.

The value is that every arrow crossing a lane boundary is a place where something can be lost: latency, failure, a human who doesn't respond, an email that goes to spam. Count your lane crossings; each one needs a timeout, a failure branch, and a way for the user to find out what happened.

## Task flow vs. user flow

**Task flow** — linear, no branches, no persona variation. `Open app → Tap search → Type query → Tap result → View item`. Useful for scoping and for writing test scripts. Not useful for design, because it asserts nothing can go wrong.

**User flow** — branches, decisions, entry points, error paths, system responses. This is the working artifact. Default to it.

The tell that you've drawn a task flow when you needed a user flow: there are no diamonds.

## Wireflow

Low-fidelity screens connected by labeled transitions. The workhorse for handoff, because it answers "what happens when I tap this" for every element that matters.

**Rules:**
- Keep fidelity *low*. A wireflow in high fidelity invites visual critique and stalls the flow conversation.
- Label every transition with the triggering action.
- Show the important non-happy states inline (error, empty) rather than in a separate document — they get built when they're in the flow and skipped when they're in an appendix.
- Annotate what's *not* visible: what's saved, what's sent, what's logged.

## Journey map

A time-based view across phases, usually spanning channels and including emotion.

**Standard rows:**
1. **Phases** — the user's stages, in their language ("figuring out if this is for me", "getting set up", "first real use", "hitting a wall")
2. **Actions** — what they do in each phase
3. **Touchpoints / channels** — where it happens (web, email, phone, in person, a colleague)
4. **Thoughts** — what they're wondering, in quotes from research
5. **Emotion** — a line showing the arc. Mark the peak and the end.
6. **Pain points** — what goes wrong
7. **Opportunities** — where intervention would pay

**How to keep it honest:**
- **Ground it in research.** A journey map assembled in a workshop from team assumptions is a record of your beliefs. It can be a useful hypothesis — just label it as one.
- **One persona, one scenario per map.** Blending personas produces a map describing nobody.
- **Include the pre- and post-product phases.** The most valuable findings are usually outside your product: how they decided to look, what they did instead, what happens after they leave.
- **Emotion line must have a shape.** A flat emotion line means you didn't do research.

## Service blueprint

A journey map extended downward to include everything that makes it work. Essential for anything with humans, operations, or physical steps in the loop — which describes most healthcare, logistics, finance, and support experiences.

**The layers, top to bottom:**
1. **Physical evidence** — what the user sees or holds
2. **User actions** — the journey
3. *— line of interaction —*
4. **Frontstage** — employee actions and system responses the user can see
5. *— line of visibility —* **(the key line)**
6. **Backstage** — employee actions the user can't see
7. *— line of internal interaction —*
8. **Support processes** — systems, vendors, infrastructure

**Why the line of visibility matters.** It's where expectation mismatches originate. Users judge the whole service by the frontstage and infer the backstage. A three-day backstage process with no frontstage signal reads as "nothing is happening." Most service design fixes are about surfacing backstage state, not speeding it up.

**Add time and failure annotations.** Duration at each step, and the failure rate. This turns a description into a prioritization tool.

## Screen-state diagram

For a single complex screen: every state it can be in, and every transition between them. Essentially a state machine.

Use when a screen has meaningful modes — an editor with view/edit/saving/conflict states, a call interface, a multi-step form on one screen. It catches impossible-state bugs and unhandled transitions that a flow diagram at the screen level hides.

**Format:** states as nodes, transitions as labeled edges (the event that causes them). Then check: is every state reachable? Is every state *exitable*? Is there any event with no defined handling in some state?

## Choosing fidelity

| Stage | Artifact | Fidelity |
|---|---|---|
| Discovery | Experience map, journey map | Rough, research-grounded |
| Scoping | User flow | Boxes and arrows, no UI |
| Design | Wireflow | Low-fi screens |
| Handoff | Wireflow + state inventory + edge-case annotations | Specific |
| Audit | User flow annotated with findings | Whatever exists, marked up |

**Anti-pattern: polishing flow diagrams.** A flow diagram is a thinking and communication tool with a short useful life. Time spent making it beautiful is time not spent on the branches it's missing. Draw it fast, argue about it, change it, throw it away.
