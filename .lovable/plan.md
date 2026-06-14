# Global Translation Rollout

## Goal
Every visible English string in the app routes through `t("key")` from `src/lib/i18n.tsx`, with full Hindi and Telugu equivalents. Switching language in the 🌐 sheet updates every screen instantly, no reload, no English left behind.

## Scope (files that contain user-facing text)
Routes:
- `index.tsx` (splash) — already partly done, audit remaining
- `auth.index.tsx`, `auth.login.tsx`, `auth.user.tsx`, `auth.member.tsx`
- `user.index.tsx`, `user.bookings.tsx`, `user.chat.tsx`, `user.profile.tsx`, `user.notifications.tsx`, `user.saved.tsx`, `user.reviews.tsx`, `user.history.tsx`, `user.help.tsx`, `user.settings.tsx`, `user.worker.$id.tsx`, `user.category.$slug.tsx`
- `member.index.tsx`, `member.bookings.tsx`, `member.chat.tsx`, `member.profile.tsx`, `member.membership.tsx`, `member.notifications.tsx`
- `admin.index.tsx`
- `__root.tsx` (page title/meta)

Components:
- `bottom-nav.tsx`, `notification-bell.tsx`, `save-worker-button.tsx`, `worker-card.tsx`, `language-selector.tsx`

Data:
- Service names, category labels, and any seed text in `src/lib/mock-data.ts` exposed via UI get keyed translations too (e.g. `service.plumber`, `service.electrician`).

Out of scope (intentionally untranslated):
- User-generated content stored in DB (names, chat messages, review text, addresses) — displayed as stored. This matches the earlier "store names as-typed" rule.
- Backend/console errors, log lines, dev-only strings.
- Brand name "LocalConnect".

## Approach

1. **Expand the dictionary** in `src/lib/i18n.tsx`:
   - Add a complete set of keys grouped by area: `splash.*`, `auth.*`, `login.*`, `signup.*`, `nav.*`, `userHome.*`, `memberHome.*`, `bookings.*`, `chat.*`, `profile.*`, `notifications.*`, `saved.*`, `reviews.*`, `history.*`, `help.*`, `settings.*`, `worker.*`, `category.*`, `admin.*`, `service.*`, `common.*` (Yes/No/Cancel/Save/Loading/Retry/Back/Search/…), `toast.*`, `errors.*`, `status.*` (pending/accepted/completed/cancelled/on the way), `time.*` (Today/Yesterday/min ago/hr ago).
   - Provide `en`, `hi`, `te` for every key.
   - Add a small `tn(value, key)` helper for translating numbers/units like "₹500", "4.8 ★", "12 km" → keep numerals, translate units (`km`, `reviews`, `jobs`).

2. **Add helpers**:
   - `useT()` shorthand re-export.
   - `tStatus(status)` → translates booking/notification status enums.
   - `tService(slug)` → translates known service slugs; falls back to stored name.

3. **Refactor every file in scope**:
   - Import `useI18n` (or `useT`) and replace literal JSX strings, placeholders, `aria-label`s, `toast()` messages, and conditional empty-state copy with `t("…")`.
   - Replace hardcoded service/category arrays with `tService(slug)` lookups while keeping slugs in code.
   - Status badges (`"Pending"`, `"Accepted"`, etc.) → `tStatus(row.status)`.

4. **Verify**:
   - `bunx tsc --noEmit` for type safety.
   - Manually switch language in preview on Home, Profile, Bookings, Chat, Notifications, Worker detail, Auth screens; confirm no English remains.
   - Grep for common English words (`"Bookings"`, `"Profile"`, `"Save"`, `"Cancel"`) in `src/routes` and `src/components`; any hit must be inside a `t("…")` key string, not raw JSX.

## Deliverables
- Updated `src/lib/i18n.tsx` with ~250+ keys × 3 languages and helper exports.
- Every route/component file in scope updated to consume `t(...)`.
- No raw English JSX text remains for user-visible UI (excluding user-generated DB content).

## Notes / Tradeoffs
- This touches ~25 files; it is a single large change with no behavior changes beyond text.
- Hindi/Telugu strings are written by me as a fluent translator-style pass; you can refine specific phrasings later by editing the dictionary in one place.
- Service/status translations are centralized so new screens automatically inherit them.

Ready to execute on approval.
