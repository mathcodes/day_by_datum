# Day by Datum: Process Log

Every release of the app, with the exact steps that shipped it and the follow-up that closed it out. Newest release is at the bottom. Deploy times and commit hashes come from Vercel's deployment history.

**Project:** https://day-by-datum.vercel.app · Repo: `mathcodes/day_by_datum` · Vercel team: Jon's Vercel Team

---

## How to ship any release

Each zip contains the whole app, including every earlier change. Check the exact filename in Downloads first, because the number in parentheses goes up with each download.

```bash
rm -rf ~/Downloads/day_by_datum
cd ~/Downloads && unzip -o "day_by_datum (N).zip"
cp -R ~/Downloads/day_by_datum/. ~/Desktop/day_by_datum/
cd ~/Desktop/day_by_datum && git add . && git commit -m "Describe the change" && git push
```

- The first line removes the previous unzipped copy so nothing stale gets mixed in.
- Keep the dot in `day_by_datum/.` so hidden files come along, including `.github` (the email scheduler) and `.gitignore`.
- The push deploys to production automatically.

---

## One-time setup (completed Sat Sep 26)

| Step | Status |
|---|---|
| GitHub repo `mathcodes/day_by_datum` created and cloned to `~/Desktop/day_by_datum` | Done |
| Vercel project `day-by-datum` linked to the repo | Done |
| Vercel env vars: `RESEND_API_KEY`, `TO_EMAIL`, `APP_PASSWORD`, `APP_SECRET`, `CRON_SECRET`, `READ_TOKEN` | Done |
| Upstash Redis added from Vercel Storage (primary region DC, no read regions) | Done |
| Deployment Protection switched to **Standard** (main address public, previews locked) | Done, verified in an incognito window |
| GitHub Actions secrets: `CRON_SECRET` (same value as Vercel), `APP_URL` = `https://day-by-datum.vercel.app` | Done |
| Checkpoint emails workflow run manually | Done, green check |
| Test email sent, Done and Missed buttons tapped, results appeared on the dashboard | Done |

Generate each secret with `openssl rand -base64 48`, using a different value for each. `CRON_SECRET` must match exactly in Vercel and GitHub.

---

## Release 0: First codebase

**Deployed:** Sat Sep 26, 5:55 PM ET · commit `9c70296` ("initial commnit")

**Contents:** Dashboard, Redis storage, signed email buttons with a confirm page, required reasons for misses, a read-only token for Claude, and the 30-minute GitHub scheduler.

**Ship it:** The repo was empty, so this release was cloned, filled and pushed:

```bash
cd ~/Downloads && unzip -o day_by_datum.zip
cp -R ~/Downloads/day_by_datum/. ~/Desktop/day_by_datum/
cd ~/Desktop/day_by_datum
ls -a
git add .
git commit -m "Day by Datum v0.1"
git push
```

Before committing, `ls -a` should show `.github`, `.gitignore`, `api`, `lib`, `public` and `package.json`.

**Close the deal:** Complete the one-time setup above. Environment variables only apply to deployments made after they're added, so redeploy if they went in after a push.

---

## Release 1: Bypass, parts, one-time items, calendar

**Deployed:** Sat Sep 26, 6:16 PM ET · commit `b918344` (reused message "initial commnit")

**Contents:** A Bypass status that requires a reason and doesn't count against the score, multi-part commitments with buttons per part, one-time goals and deadlines, and the Calendar tab.

**Ship it:**

```bash
rm -rf ~/Downloads/day_by_datum
cd ~/Downloads && unzip -o "day_by_datum (1).zip"
cp -R ~/Downloads/day_by_datum/. ~/Desktop/day_by_datum/
cd ~/Desktop/day_by_datum
git add . && git commit -m "Bypass, parts, one-time items, calendar" && git push
```

**Close the deal:**
- [ ] Commitments: edit "Morning walk with the dog", rename it to **Morning walk**, and add the parts `I walked` and `Dog walked`. Update, then Save.
- [ ] On days the dog is with your sister, mark "I walked" Done and Bypass "Dog walked" with a reason.

---

## Release 2: Home dashboard

**Deployed:** Sat Sep 26, 6:33 PM ET · commit `c38ee2e` ("Home dashboard redesign")

**Contents:**
- A sidebar with search, a KPI row, and a Needs attention card with bulk actions.
- A Health card with suggestions.
- Trend and category charts with drill-down, and an activity feed.
- Date range and category filters.
- CSV, print/PDF and view-only link export.

**Ship it:**

```bash
rm -rf ~/Downloads/day_by_datum
cd ~/Downloads && unzip -o "day_by_datum (2).zip"
cp -R ~/Downloads/day_by_datum/. ~/Desktop/day_by_datum/
cd ~/Desktop/day_by_datum && git add . && git commit -m "Home dashboard redesign" && git push
```

**Close the deal:**
- [x] Switch Deployment Protection to **Standard**, so the view-only link, email buttons and scheduler aren't blocked by Vercel's login. Done later that evening.

---

## Release 3: Weekly progress bar and history

**Deployed:** Sat Sep 26, 6:43 PM ET · commit `c46741e` ("progress bar")

**Contents:** A stacked weekly bar filled only by completed tasks and colored by group, an "on pace" marker, and the Progress history page with one mini bar per week.

**Ship it:**

```bash
rm -rf ~/Downloads/day_by_datum
cd ~/Downloads && unzip -o "day_by_datum (3).zip"
cp -R ~/Downloads/day_by_datum/. ~/Desktop/day_by_datum/
cd ~/Desktop/day_by_datum && git add . && git commit -m "Weekly progress bar and history" && git push
```

**Close the deal:**
- [ ] Optional: decide whether the bar's groups should stay Health, Money and Habits, or become custom groups like Fitness, Finances and Music.

---

## Release 4: Priority weighting

**Deployed:** Sat Sep 26, 6:49 PM ET · commit `83f30cc` ("Priority weighting"). The same commit was redeployed at 8:20 PM ET.

**Contents:** High (4×), Medium (2×) and Low (1×) priority per commitment, a weekly bar measured in points, and High badges.

**Ship it:**

```bash
rm -rf ~/Downloads/day_by_datum
cd ~/Downloads && unzip -o "day_by_datum (4).zip"
cp -R ~/Downloads/day_by_datum/. ~/Desktop/day_by_datum/
cd ~/Desktop/day_by_datum && git add . && git commit -m "Priority weighting" && git push
```

**Close the deal:**
- [ ] Edit **Slept 7+ hours** and set it to High.
- [ ] Edit **10,000 steps** and set it to Low.
- [ ] Add **Groceries instead of takeout** in Money or Habits and set it to Low, or Medium if takeout is a real budget leak.
- [ ] Save.

---

## Release 5: Priority qualifier and events

**Deployed:** Never deployed on its own. This code shipped inside Release 6 (commit `4d8645e`), since each zip includes everything before it.

**Contents:**
- "What makes this matter?" questions that suggest a priority, with manual override.
- An Event type with date, time, place and people, shown in orange on the calendar.

**Ship it (as originally given):**

```bash
rm -rf ~/Downloads/day_by_datum
cd ~/Downloads && unzip -o "day_by_datum (5).zip"
cp -R ~/Downloads/day_by_datum/. ~/Desktop/day_by_datum/
cd ~/Desktop/day_by_datum && git add . && git commit -m "Priority qualifier and events" && git push
```

**Close the deal:**
- [x] Deployment Protection switched to Standard and verified in an incognito window.
- [x] GitHub secrets added and the workflow run manually, with a green check.

---

## Release 6: Professional redesign, onboarding templates, weekly frequency

**Deployed:** Sat Sep 26, 8:51 PM ET · commit `4d8645e` ("Redesign, onboarding templates, weekly frequency")

**Contents:**
- A dark slate theme with a mint accent and the Manrope typeface, plus the sideways-scroll fix, confirmed with zero overflow on desktop and phone.
- Onboarding for fresh installs, with eight templates: College student, New parent, Single midlife, Starting over, Kid run by a parent, Older adult, Traveler, and Midlife reset, plus Start from scratch.
- Weekly frequency.

**Ship it:**

```bash
rm -rf ~/Downloads/day_by_datum
cd ~/Downloads && unzip -o "day_by_datum (6).zip"
cp -R ~/Downloads/day_by_datum/. ~/Desktop/day_by_datum/
cd ~/Desktop/day_by_datum && git add . && git commit -m "Redesign, onboarding templates, weekly frequency" && git push
```

**Close the deal:**
- [ ] Your existing account won't see onboarding, since it only runs on a fresh install. To try the templates, go to Commitments, then **Add from a template**. Items already on your list are skipped.

---

## Release 7: Linked calendars (Google and Outlook)

**Deployed:** Sat Sep 26, 9:58 PM ET · commit `fe3a3b1` ("Link Google and Outlook calendars"). The process log itself followed at 9:59 PM ET, commit `b946b05`.

**Contents:**
- Google Calendar and Outlook buttons with brand icons on the Calendar and Commitments pages.
- Live links that re-sync every few hours, updating moved and renamed events and dropping deleted ones.
- One-time `.ics` uploads, with several files at once.
- Correct handling of recurring events, all-day events, daylight saving, and Windows time zone names.
- Calendar links are never shared with view-only viewers, and the server only fetches from Google and Microsoft calendar hosts.

**Ship it:**

```bash
rm -rf ~/Downloads/day_by_datum
cd ~/Downloads && unzip -o "day_by_datum (7).zip"
cp -R ~/Downloads/day_by_datum/. ~/Desktop/day_by_datum/
cd ~/Desktop/day_by_datum && git add . && git commit -m "Link Google and Outlook calendars" && git push
```

**Close the deal:**
- [ ] Link a real calendar. For Google: Settings and sharing, then Integrate calendar, then copy the **Secret address in iCal format**.
- [ ] Watch for the first automatic checkpoint email at **9:00 AM ET**, and answer it.

---

## Release 8: Pin Node version

**Why:** Vercel warned that `"node": ">=20"` in `package.json` would automatically jump to the next major Node version when one is released. The project runs on Node 24, so the version is now pinned to `"24.x"`. This is a one-line change with no app changes.

**Ship it:**

```bash
cd ~/Desktop/day_by_datum
sed -i '' 's/"node": ">=20"/"node": "24.x"/' package.json
cp ~/Downloads/PROCESS_LOG.md .
git add package.json PROCESS_LOG.md && git commit -m "Pin Node 24" && git push
```

**Close the deal:**
- [ ] The next build log no longer shows the "engines" warning.

---

## Release 9: Atmosphere (glass cards, glow, contour lines)

**Contents:**
- A faint colored glow behind the app: mint top-left, violet top-right, sky at the bottom.
- Barely-there topographic contour lines, a nod to "datum", the reference point in surveying.
- Glass cards: slightly see-through with a blur, a soft top sheen and a lighter top rim. The sidebar, dialogs and bottom bars match.

All of it is drawn in CSS with no image downloads. Blur is lighter on phones, and everything switches off for reduced-transparency settings, browsers without blur support, and printing. This zip also includes the Release 8 Node pin, so pushing this covers both.

**Ship it:**

```bash
rm -rf ~/Downloads/day_by_datum
cd ~/Downloads && unzip -o "day_by_datum (8).zip"
cp -R ~/Downloads/day_by_datum/. ~/Desktop/day_by_datum/
cd ~/Desktop/day_by_datum && git add . && git commit -m "Glass cards, glow, contour lines" && git push
```

**Close the deal:**
- [ ] Look at it on your phone in daylight and at night. If the lines or glow feel like too much or too little, say so. Intensity is set by a few numbers.

---

## Release 10: Dev tooling, tests in the repo, CI

**Contents:**
- `package.json` scripts for local development, pulling each environment's settings, syntax checks, the test suite, manual cron runs, deploys, and logs.
- The 147-check test suite moved into `tests/`, run with `npm test`.
- A **Checks and tests** GitHub workflow that runs on every push.
- The local-development and environments guide in the README.

All of it was verified from a clean copy of the repo: fresh `npm install`, then `npm run verify`, with 147 of 147 passing. A planted failing test, a syntax error and a missing secret each exit with an error, so the workflow fails when it should.

**Ship it:**

```bash
rm -rf ~/Downloads/day_by_datum
cd ~/Downloads && unzip -o "day_by_datum (9).zip"
cp -R ~/Downloads/day_by_datum/. ~/Desktop/day_by_datum/
cd ~/Desktop/day_by_datum && npm install && npm run verify
git add . && git commit -m "Dev tooling, tests, CI" && git push
```

**Close the deal:**
- [ ] The **Checks and tests** workflow shows a green check in the repo's Actions tab.
- [ ] Optional: complete the local-development setup in the README and run `npm run dev`.
- [ ] Optional: create a separate Upstash database for Preview and Development.

---

## Open items

- [ ] Set due days on **Chase Amazon Visa**, **Buzzy loan** and **Rent** if they aren't set yet.
- [ ] One week of real use before new features. Answer every checkpoint honestly.
- [ ] At month's end, bring statements and check the payments against the record.
- [ ] Before any other users: verify `jonchristie.net` with Resend, so emails can go to addresses other than yours.
