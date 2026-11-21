# Scrum Poker — Access Key Rotation

_Documented 2026-05-20. Subject app: Scrum Poker (`/var/www/scrumpoker`). This
note lives in the `retrospective` docs folder for reference; the code it
describes is in the `scrumpoker` repo._

## Summary

Each Scrum Poker team has one access key that its members use to join rooms.
That key can be **rotated** — replaced with a fresh one, with the old key
invalidated immediately. During the May 2026 hardening work, rotation was
reworked so keys are stored only as salted hashes: a rotated key is shown
exactly once and is never recoverable afterwards.

## What rotation does

Rotating a team's key:

- generates a new random 12-character key for that team,
- invalidates the previous key instantly,
- preserves the team's name, active/suspended status, and original creation date.

It is the remedy when a key leaks, is lost, or is weak (shorter than 12 characters).

## Changes made

### PR #51 — Harden access keys

- Rotation preserves the team's `createdAt` timestamp — rotating changes the
  key value, not the team's identity.
- Introduced a `weak` flag for keys shorter than 12 characters. A rotated key
  is re-evaluated, so rotating a weak key clears the flag (generated keys are
  always 12 characters).

### PR #52 — Store access keys hashed at rest (the main change)

- `keys.json` no longer stores plaintext keys. Each record is a salted
  SHA-256 hash: `{ hash, salt, active, createdAt }`.
- `rotateAccessKey` now:
  - generates a fresh 12-character key and a fresh salt,
  - stores only the salted hash — the new key's plaintext is never written to disk,
  - overwrites the old hash, so the previous key fails verification at once,
  - preserves `name`, `active`, and `createdAt`,
  - returns the new key value **once**, plus a short `fingerprint` (hash
    prefix) used for the audit log.
- The admin activity log records each rotation as a `rotated` event,
  identified by the `fingerprint` — never the raw key value.
- Admin UI: **Rotate key** → confirmation dialog → the new key is shown once
  in a reveal dialog with copy buttons (key / invite / link). Once that dialog
  is closed the key cannot be retrieved; it exists only as a hash.

### Production deploy (2026-05-20)

After the hashed-storage code was deployed and `keys.json` was migrated to
hashed records, the legacy weak `data` team key was rotated via `/admin` to a
strong 12-character key. The `powwr` and `test` keys were already long enough
and did not need rotation.

## How to rotate a key

1. Open `/admin` and unlock with the admin key (`SCRUM_POKER_ADMIN_KEY`,
   stored in `/etc/scrumpoker.env` on the server).
2. Find the team, expand its row, click **Rotate key**, and confirm.
3. The new key is shown once in the reveal dialog — copy the key (or the full
   invite / link) immediately.
4. Send the new key to the team. The old key is already dead; members must
   re-join with the new one.

There is no command-line rotation. `manageKeys.js` supports `generate`,
`list`, `remove`, and `migrate` only — rotation is admin-UI / API only
(`POST /api/admin/keys/:name/rotate`).

## Caveats

- A rotated key cannot be recovered. If it is lost before being shared,
  rotate again.
- Rotation invalidates existing invite links for that team — re-share the new invite.

## References

- PR #51 — Harden access keys (min length, weak flag, timing-safe compare, metadata)
- PR #52 — Store access keys hashed at rest
- Both merged to the `scrumpoker` `main` branch (current `3e168d6`).
