# Flow Audit: Procedure and Checklist

A repeatable procedure for auditing an existing or proposed flow. Roughly 60–90 minutes for a medium flow.

---

## Procedure

**1. Scope.** Name the flow, the actor (with their state: new / returning / invited / expired / trial / admin), the trigger, and the success condition in observable terms.

**2. Inventory entry points.** List every way a user can enter this flow. For each, note what state they arrive with and what context is available. Mark the ones nobody has designed for.

Typical list: in-app navigation, direct URL / deep link, notification, email link, search result (internal and external), shared link from another user, bookmark, browser back into the middle of the flow, resumption after session expiry, redirect after auth, redirect back from a third party.

**3. Walk the happy path**, recording every screen and every system response.

**4. At each step, run the branch questions:**
- What can the user do here besides the intended action?
- What can fail?
- What can be missing or empty?
- What can be slow?
- What if they leave and come back?
- What if they do it twice?
- What if someone else changed something?
- What if they don't have permission?
- Can they go back? Cancel? Undo?
- What is preserved if they abandon?

**5. Run the state checklist on every screen** (see `states-and-edges.md`). This is the highest-yield step.

**6. Walk it on a phone, with a keyboard only, and with a screen reader.** Each pass finds a different class of defect.

**7. Walk it with realistic data** — high volume, long strings, messy real input, and an account that's been in use for two years.

**8. Mark the peak and the end.** Are they designed?

**9. Score and write up.** Group findings by severity (see the `ux-principles` skill for the severity scale).

---

## The checklist

### Entry
- [ ] Every entry point identified and handled
- [ ] Deep links land in the right place with the right context
- [ ] Intended destination survives an auth round trip (including SSO redirects)
- [ ] The flow works for a user who arrives mid-way via a shared link
- [ ] Browser back into the flow doesn't produce a broken state

### Structure
- [ ] Every decision point has a labeled condition and a default
- [ ] No step collects data that isn't used, or isn't used until much later
- [ ] No step requires information the user is unlikely to have on hand
- [ ] Step count is honest and never increases mid-flow
- [ ] The flow has the same number of steps or fewer than the reverse flow (cancel vs. signup)
- [ ] Order matches how the user actually does the task offline

### Exits
- [ ] Every step has a back
- [ ] Every step has a cancel or escape
- [ ] Every modal closes via Escape, scrim, and a visible control
- [ ] Abandoning preserves entered data
- [ ] Refresh mid-flow doesn't lose progress (state in the URL where sensible)
- [ ] No dead ends — every terminal screen, including errors, has a next action
- [ ] No loops without an escape (verify → fail → verify → fail with no route to help)

### Feedback and state
- [ ] Every action produces feedback within 100ms
- [ ] Feedback weight matches action consequence
- [ ] Anything the user needs later exists somewhere durable, not only in a toast
- [ ] Consequential system actions are announced, never silent
- [ ] Any action with non-local effects states its scope *before* executing
- [ ] Long-running work is backgrounded and reports completion

### States (per screen)
- [ ] Empty (first use), empty (cleared), and no-results are three different designs
- [ ] Loading matched to duration tier; no sub-300ms spinner flash
- [ ] Partial-load handled without failing the whole screen
- [ ] One item and ten thousand items both render correctly
- [ ] Long strings and long numbers handled
- [ ] Every error class handled with cause + action
- [ ] Offline and degraded states honest about what works
- [ ] Stale data detected; no silent overwrite
- [ ] Permission-denied explains and offers a route
- [ ] Disabled controls explain why (or aren't disabled)
- [ ] Success state says what happened, what's next, and how to undo
- [ ] Pending work is findable after navigating away

### Memory and context
- [ ] Nothing must be carried in the user's head between steps
- [ ] Confirmation screens display what is being confirmed
- [ ] Applied filters/selections remain visible
- [ ] Search query, filters, and scroll position survive back-navigation
- [ ] Context survives every hop out (email, payment provider, OTP app, SSO)

### Second time
- [ ] The returning user's path is shorter than the first-timer's
- [ ] One-time content (tours, tips, welcome) doesn't repeat
- [ ] Skipped steps stay skipped
- [ ] Previously entered data is pre-filled
- [ ] The partially-onboarded returning user has a designed experience

### Accessibility
- [ ] Complete keyboard path, including any gesture- or drag-driven action
- [ ] Visible focus throughout; logical focus order
- [ ] Focus moves to errors and to newly opened surfaces; restores on close
- [ ] Async changes announced to assistive technology
- [ ] Works at 200% zoom and 320px width
- [ ] `prefers-reduced-motion` respected

### Ethics
- [ ] Cancellation/opt-out is at most as hard as signup/opt-in
- [ ] No pre-checked consent or marketing boxes
- [ ] Total cost visible before commitment of time or money
- [ ] Any urgency, scarcity, or popularity claim is true right now
- [ ] Decline options are neutrally worded and comparably prominent
- [ ] A declined prompt has a bounded re-ask policy

---

## Severity guide for flow defects

| Severity | Examples |
|---|---|
| **4 — Blocker** | Data loss on error or refresh; a loop with no escape; double-charge; silent overwrite of someone's work; a required step that can't be completed; no keyboard path |
| **3 — Major** | Input cleared on error; lost destination after auth; unexplained disabled control; no error branch; search state lost on back; cancellation harder than signup |
| **2 — Minor** | Missing empty state; spinner flash; toast in the wrong corner; redundant confirmation; step count not shown |
| **1 — Cosmetic** | Inconsistent button placement between steps; imprecise copy |

---

## A 10-minute version

When you don't have 90 minutes, these five find most of it:

1. **Break something.** Turn off the network mid-flow. Submit an invalid value. Revoke the permission.
2. **Refresh at every step.** See what survives.
3. **Press back everywhere**, including browser back.
4. **Run it with an empty account and with a huge one.**
5. **Do the whole thing with the keyboard only.**
