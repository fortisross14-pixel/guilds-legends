# Canonical Flows

Most flows are variations on a small set of well-understood structures. Start from the known-good shape and its known failure points rather than from a blank canvas.

---

## Onboarding / Activation

**Goal.** Get the user to their first real value ("aha moment"), not through your tour.

**Structure.** `Entry → Value framing → Minimum setup → First meaningful action → Value delivered → Next-step prompt`

**Decision points.** New vs. invited user (invited users should skip workspace creation entirely). Has data to import vs. starting fresh. Solo vs. team. Trial vs. paid vs. free.

**Design rules.**
- **Define the activation moment concretely** — the specific action that correlates with retention. Everything in onboarding either moves toward it or is cut.
- **Defer everything deferrable.** Profile photo, team invites, integrations, preferences. Collect at the moment of relevance (progressive profiling), not up front.
- **Do work for them.** Sample data, a template, a pre-built example. An empty product is the hardest product to evaluate.
- **Endowed progress:** start the checklist with real completed items ("Account created ✓").
- **Skippable, always.** And remember the skip — don't re-prompt next session.
- **Second session is the real test.** Design what a returning, half-onboarded user sees.

**Known failures.** A product tour instead of a first use. Collecting data that serves your analytics rather than their setup. An empty state after onboarding completes. Requiring team invites before solo value. Blocking on an integration whose credentials the user doesn't have.

---

## Sign-up and Sign-in

**Structure.** `Entry → Method choice → Credentials → Verify → Land`

**Decision points.** New vs. returning (and the system frequently doesn't know). SSO/social vs. password vs. magic link. Verification required now or deferrable. Invited to an existing org vs. creating one.

**Design rules.**
- **One combined email field** that routes to sign-in or sign-up is better than making the user self-identify. Users regularly don't remember whether they have an account.
- **Show which method they used last time.** The single biggest source of auth friction is a user with an SSO account trying a password.
- **Never clear the password field on error**, and allow show-password.
- **Defer email verification** past first value where security allows. Verify-before-use kills activation.
- **Land them where they intended**, not on a generic dashboard. Preserve the deep link through the entire auth round trip — including through the SSO redirect.
- Support password managers: correct autocomplete attributes, no paste blocking, standard field names.

**Known failures.** Losing the intended destination. Vague "invalid credentials" when the account doesn't exist (a genuine security/usability tradeoff — decide deliberately). Password rules revealed only on failure. A verification email in spam with no resend. Magic links that expire before the user checks email, or open in a different browser and lose the session.

---

## Password Reset

Deceptively failure-prone; worth drawing fully.

**Structure.** `Request → Email sent → Click link → New password → Confirm → Signed in`

**Design rules.**
- **Say the same thing whether or not the account exists** (prevents enumeration), but make it specific enough to be useful: "If an account exists for x@y.com, we've sent a link."
- **State the expiry** on the page and in the email.
- **Resend with a cooldown**, visible.
- **Sign them in after reset.** Making the user log in again with the password they just typed is gratuitous.
- Handle: link already used, link expired, user already signed in on another device, user who signed up with SSO and has no password (this one is very commonly unhandled — they'll loop forever).

---

## Invite and Team Join

**Structure.** `Inviter selects people → Sends → Recipient receives → Recipient accepts → Provisioned → Lands in context`

**Decision points.** Recipient has an account or not. Already a member. Domain-restricted. Seat limit reached. Invite expired or revoked.

**Design rules.**
- **The invite link must carry context through signup.** An invited user who lands on a generic signup page and then an empty workspace has lost the invite.
- **Show the inviter and the destination** in the email and on the accept page. Anonymous invites get ignored or reported as phishing.
- **Handle the seat-limit branch explicitly** — inviter needs to know before sending, and the recipient needs a graceful message, not a 403.
- Land them on the thing they were invited to, not a dashboard.

---

## Checkout and Payment

The most-studied flow in existence. Baymard's research is the reference corpus; abandonment consistently runs around 70%, with unexpected costs the top cited reason.

**Structure.** `Cart → (Auth or guest) → Shipping → Delivery method → Payment → Review → Confirm → Confirmation`

**Design rules.**
- **Guest checkout, always.** Forced account creation is a top-three abandonment cause. Offer account creation *after* purchase, when you can pre-fill everything.
- **Show total cost early**, including shipping and tax estimates. Hidden costs at the final step is both the top abandonment reason and, for mandatory fees, increasingly illegal.
- **One column, one task per step.** Never multi-column checkout forms.
- **Address autocomplete** and lenient formatting. Don't require a state for countries without them.
- **Preserve everything on error.** Never clear a card field.
- **Show the order summary persistently** so nothing is held in memory.
- **Progress indicator** with honest step count.
- **Confirmation must be substantive**: what was bought, total charged, when it arrives, how to change it, how to get help.

**Known failures.** Surprise costs. Forced registration. Validation that rejects valid cards or addresses. Losing the cart on sign-in. A double-submit that double-charges. No way back to edit without losing progress. Silent failure after payment provider redirect.

---

## Subscription: Upgrade, Downgrade, Cancel

**Upgrade structure.** `Trigger (limit hit or intent) → Plan comparison → Confirm change → Payment → New state active`
- Show proration explicitly. "You'll be charged $34 today, then $99/month starting Nov 3."
- Trigger at the moment of the limit, in context, with the limit named.

**Downgrade structure.** `Intent → Show what's lost → Confirm → Schedule → Effective date`
- **Say exactly what will be lost**, specifically ("your 4 extra seats and 11 saved reports"). This is honest loss aversion.
- Take effect at period end, not immediately, and say so.

**Cancel structure.** `Intent → (One offer) → Reason (optional) → Confirm → Effective date → Data export path`
- **At most as many steps as signup.** This is now a legal requirement in several jurisdictions.
- **One retention offer, clearly declinable.** Not a gauntlet.
- **Cancel means cancel.** Confirm the effective date, confirm no further charges, and send an email record.
- **Offer pause** as a genuine alternative — it converts better than obstruction and doesn't damage trust.
- **Export must be available** without contacting support.
- Reason collection is optional and after the cancellation is confirmed, never as a gate.

---

## Search and Filter

**Structure.** `Query entry → Results → Refine → Select → (Back to results)`

**Design rules.**
- **Preserve query, filters, scroll position, and pagination on back.** The single most-violated rule in search UX.
- **Make search state URL-addressable** so it can be shared and bookmarked.
- **Show applied filters as removable chips**, with a clear-all.
- **Say what was searched** and how many results, and state the scope if search doesn't cover everything.
- **Zero results is a designed state**: show the query, suggest corrections, relax a filter automatically and say you did, offer a browse path.
- Filter counts should show how many results each option would yield; disable or hide options yielding zero.

---

## Create → Edit → Save

**Design rules.**
- **Decide and communicate the save model.** Explicit save, autosave, or draft-then-publish. Show state persistently.
- **Warn on unsaved navigation**, or don't have unsaved state.
- **Handle concurrent edit.** Someone else changed it: detect, notify, and never silently overwrite.
- **Undo at a meaningful granularity**, and name what will be undone.
- **New vs. edit should share a layout** so users learn one thing.

---

## Deletion

**Structure.** `Intent → Scope disclosure → Confirm (proportionate) → Execute → Undo window → Permanent`

**Design rules.**
- **State the scope before confirming.** "This will also delete 3 linked reports and 14 comments." Scope surprise is the most damaging deletion defect.
- **Match friction to reversibility.** Undoable → do it and offer undo. Irreversible → type the name to confirm.
- **Undo over confirm** wherever the operation can be deferred.
- **Distinguish remove / archive / delete** with different words and different weight.
- **State retention** on the item: "Deleted items are recoverable for 30 days."
- **Handle references.** What happens to things pointing at the deleted object? Never leave dangling references the user can see.

---

## Sharing and Permissions

**Design rules.**
- **Show the current audience ambiently** on the object, not only inside a dialog.
- **Preview the change before applying it**: "Anyone with the link will be able to edit."
- **Distinguish link access from named access** clearly — the mental model for these differs sharply.
- **Handle the requester side**: a user without access needs a request-access path, not a dead 403.
- **Inheritance must be visible.** Permissions inherited from a parent are the top source of accidental exposure.

---

## Import and Bulk Upload

**Structure.** `Source select → Upload/connect → Map fields → Preview → Validate → Confirm → Process → Report`

**Design rules.**
- **Preview before committing**, with a sample of parsed rows.
- **Validate before processing**, and report all errors at once, not one per attempt.
- **Partial success is the normal case.** "847 of 900 imported. 53 rows had problems — download them, fix, re-upload."
- **Never make them start over** for a fixable error.
- **Let them leave.** Long imports run in the background with a notification on completion.
- **Provide a template** for the expected format, and accept messy real files (Postel's Law).
- **Make it undoable** — a bulk import that can't be rolled back is a trap.

---

## Settings

**Design rules.**
- **Group by user task, not by system module.** Card-sort this if the list is long.
- **Immediate save with confirmation** beats a save button, for independent toggles. Use a save button when changes are interdependent and need to apply together.
- **Show the effect**, not just the name. "Email digest — sent Mondays at 9am to you and 3 teammates."
- **Show the default and offer reset.**
- **Make settings searchable** once there are more than ~20.
- **Say the scope**: personal, workspace, or organization — and who else this affects.
