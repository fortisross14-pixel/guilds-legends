# States and Edge Cases

Every screen is a set of states, not a picture. This file is the treatment guide for each one. Most shipped usability defects live here.

---

## Empty states

**Three distinct kinds — treat them differently.**

**1. First use (nothing yet, ever).** The highest-value screen in your product, and usually the least designed. It must:
- Say what belongs here, in one line.
- Say why it's worth doing.
- Give **one** primary action to create the first item.
- Show what it will look like when populated — a sample, an illustration of a filled state, or a template.
- Never show an error tone or an empty table with headers and no rows.

**2. User-cleared (they finished or deleted everything).** This is a *success* state and should read as one. "All caught up." Do not show onboarding copy to someone who just completed their work — it reads as a demotion.

**3. No results (a filter or search returned nothing).** Not an empty state — a *feedback* state. Show the query and active filters, say which filter is responsible if you can, offer to relax or clear it, and provide a browse alternative. Never show the first-use empty state here; it implies the user has no data when they do.

**Also:** error-empty (the load failed) must look different from genuinely-empty. Conflating them makes users think their data is gone.

---

## Loading states

Match the treatment to the duration and the certainty. See the response-time tiers in `ux-laws/references/speed-and-targeting.md`.

- **< 100ms** — nothing. Any indicator is a flicker.
- **100ms–1s** — no spinner. Change state immediately; let the content arrive.
- **1s–3s** — skeleton screen matching the layout that will arrive. Prevents layout shift and communicates what's coming.
- **3s–10s** — determinate progress, a description of the step, and a cancel.
- **> 10s** — background it. Let the user leave; notify on completion.

**Rules.**
- **Delay the indicator ~300ms.** If the work finishes first, nothing flashes.
- **Never let a skeleton's layout differ from the real content's** — the shift is worse than the wait.
- **Reloading with existing content:** keep the stale content visible and show a subtle refresh indicator. Blanking the screen to reload is a regression.
- **Named steps beat a bar** for multi-stage work: "Uploading… Scanning… Processing…" Occupied time feels shorter.

---

## Partial states

Some data arrived; some didn't. Extremely common and almost never designed.

- Show what you have. Don't fail the whole screen because one widget's API failed.
- Mark the failed region specifically, in place, with a retry for that region only.
- **Never show stale data as if it were fresh.** Timestamp it or mark it.
- If a number is incomplete, say so — a partial total presented as a total is a correctness bug, not a UX nicety.

---

## Data volume extremes

- **One item.** Does the layout collapse? Does a grid with one card look broken? Is pagination showing "1 of 1"?
- **Very many items.** Virtualize. Paginate or infinite-scroll with a deliberate choice (infinite scroll breaks back-navigation and footers; pagination breaks scanning). Provide sort and filter before the list gets long, not after.
- **Long strings.** Names, emails, titles, URLs with no spaces. Test with a 200-character unbroken string. Decide per field: truncate with ellipsis and a tooltip, wrap, or scroll. Truncation in the middle (`verylong…name.pdf`) preserves the extension and is often better.
- **Long numbers.** Alignment, thousands separators, currency width, negative signs.
- **Deep nesting.** Indentation that runs out of horizontal room.
- **Zero as a value** vs. missing data. `0` and `—` mean different things; don't render null as zero.

---

## Error states

**Classify first — the treatment differs:**

| Kind | Example | Treatment |
|---|---|---|
| **Validation** | Bad email format | Inline, at the field, on blur. Never clear the input. |
| **Conflict** | Someone else edited this | Show both versions; let the user choose. Never auto-overwrite. |
| **Permission** | Not authorized | Explain, and offer a path — request access, switch account, contact the owner. |
| **Not found** | Deleted or wrong URL | Say which, offer search and a way back. |
| **Rate limit** | Too many requests | Say when they can retry, specifically. |
| **Transient system** | 500, timeout | Retry (automatic with backoff for idempotent calls), then a manual retry. |
| **Persistent system** | Service down | Status page link, an ETA if you have one, and what still works. |
| **Client/offline** | No connection | Distinguish from server errors. Say what's queued. |

**Every error message needs three things:** what happened, why, and what to do next — with the "what to do" as an actionable control where possible. Keep a copyable reference ID, demoted in size.

**Error-state rules.**
- **Preserve user input.** Always. Non-negotiable.
- **Don't blame.** "That email address doesn't look right", not "You entered an invalid email."
- **Error summary at top *and* inline at fields**, for long forms, with the summary linking to the fields.
- **Focus management:** move focus to the first error, and announce it to assistive technology.
- **Never a dead end.** Every error screen needs a next action.

---

## Offline and degraded states

- **Say what still works.** An honest partial mode beats a blanket "you're offline" screen.
- **Queue and show the queue.** "3 changes will sync when you reconnect" — with a visible list.
- **Disable what can't work**, with an explanation, rather than letting actions fail silently.
- **Reconcile on reconnect** and tell the user what happened, especially if anything conflicted.
- Distinguish *device offline* from *service unreachable*; the user's remedy is different.

---

## Stale state

Someone or something changed the data while the user was looking at it.

- **Detect it** (version/etag). Silent overwrite is the worst outcome.
- **Notify non-destructively**: "This was updated by Sam 2 minutes ago. Refresh to see changes." Don't blow away their unsaved edits to show you the new version.
- **On save conflict**, show both versions and let the user choose or merge.
- For live-collaborative surfaces, show presence (who else is here) so the conflict is anticipated rather than discovered.

---

## Permission and disabled states

**Disabled controls are a recurring, avoidable defect.** A greyed-out button with no explanation gives the user no path forward and no information.

Options, in order of preference:
1. **Don't show it** if the user can never do it in this context.
2. **Show it enabled** and explain on attempt — the user learns the requirement and how to satisfy it.
3. **Show it disabled with a visible inline reason** — not a hover tooltip, which doesn't exist on touch and isn't reachable by keyboard for a disabled element.
4. **Never** show it disabled with no reason at all.

Also ensure disabled elements meet contrast expectations enough to be readable, and that a disabled state is distinguishable from an enabled one for colorblind users.

---

## Success states

The most wasted screen in most products. The user's attention is at its peak and you have their trust.

A good success state says:
- **What happened**, specifically and in their terms.
- **What happens next**, and when. ("Your report will send Monday at 9am to 4 people.")
- **How to change or undo it.**
- **One sensible next action** — not a dead end, not a dump of unrelated CTAs.

For anything the user may need to reference later, the success state must also exist as a durable record — an email, an activity entry, a status field. A toast is not a receipt.

---

## In-progress / pending states

Work accepted but not complete: a queued job, a pending transfer, an awaiting-approval item.

- **Give it a visible home.** The user must be able to find it again after navigating away.
- **Show the current stage**, not just "pending."
- **Say what happens on completion** and how they'll find out.
- **Offer cancel** where possible, and say clearly when it stops being cancellable.
- **Handle the failure of a pending item** — it must not just silently disappear.

---

## Interruption and resumption

The user's session doesn't respect your flow boundaries.

- **Closing the tab / app backgrounding** — what is preserved? Drafts should survive.
- **Session expiry mid-flow** — re-authenticate and return *to the same place with the same data*, not to a dashboard.
- **Navigating away and back** — preserve state; the browser back button must work.
- **Refresh mid-flow** — a multi-step flow that loses everything on refresh is a defect. Keep step state in the URL.
- **Leaving for an external step** — email verification, payment provider, SSO, an OTP from another app. Every hop out is a chance to lose context; carry it through and return them precisely.
- **Second device** — starting on mobile and finishing on desktop is common. Decide whether you support it, and if not, say so.

---

## Accessibility states (often missed entirely)

- **Focus** — visible on every interactive element, never removed without a replacement. Focus order matches visual order.
- **Focus trapping** in modals, and focus restoration to the triggering element on close.
- **Live-region announcements** for async changes: errors, results loaded, saved, item removed.
- **Reduced motion** — respect `prefers-reduced-motion` for anything animated.
- **High contrast / forced colors** — check that borders and state indication survive.
- **Zoom to 200%** and 320px viewport width — content must reflow without horizontal scrolling.
- **Keyboard-only path** through every flow, including drag-and-drop and any gesture-driven action.
