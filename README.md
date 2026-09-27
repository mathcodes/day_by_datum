# day_by_datum

Three daily checkpoints, check-in emails with Done/Missed buttons, and one record that Claude reads to hold you to it.

## How it works

- **Dashboard** (`/`): mark items, see a calendar of what's due, edit commitments, and check your scorecard. Password-protected.
- **Statuses**: Done, Missed or Bypass. Missed and Bypass require a reason. Bypasses don't hurt your score, but they stay on the record.
- **Parts**: split a commitment into pieces (e.g. "I walked" and "Dog walked"), each with its own buttons.
- **One-time items**: goals and deadlines on a specific date. They show by name on the calendar.
- **Checkpoint emails**: GitHub Actions pings `/api/cron` every 30 minutes. The app sends each checkpoint's email once per day, only if something is still open.
- **Email buttons** open a confirm page. Nothing is written until you tap, because mail scanners prefetch links. Missed requires a reason.
- **Claude reads** `GET /api/state?token=READ_TOKEN` (read-only).

No npm dependencies. Storage is Upstash Redis over REST, and email is Resend over REST.

## New users

A fresh install opens on onboarding: pick one of eight templates (College student, New parent, Single midlife, Starting over, Kid run by a parent, Older adult, Traveler, Midlife reset) or start from scratch. Each template sets suggested checkpoint times and a starting list you can trim before saving. Existing users can add any template's items later from Commitments, then **Add from a template**. Items already on the list are skipped.

## Linked calendars

Link Google Calendar or Outlook from the Calendar or Commitments page. Two ways to connect:

- **Live link**: Google's "Secret address in iCal format" or Outlook's published ICS link. The app re-reads it every few hours, updating moved or renamed events and dropping cancelled ones. The server only fetches from Google and Microsoft calendar hosts (`api/ics.js`).
- **File upload**: one-time import of `.ics` files (Google's Export .zip contains one per calendar; Outlook Classic uses File, then Save Calendar).

Events come in for the next 60 days, including recurring events, time zones, and all-day events. Calendar links work like passwords, so they're never sent to view-only viewers. Brand icons live in `public/brand/`.

## Local development

One-time setup on your machine:

```bash
npm i -g vercel          # Vercel CLI
vercel login
cd ~/Desktop/day_by_datum
npm install              # installs the test tools
npm run link             # choose Jon's Vercel Team, then day-by-datum
npm run env:dev          # writes .env.local from Vercel's Development settings
npm run dev              # app at http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Runs the site and API locally with `vercel dev` |
| `npm run env:dev` / `env:preview` / `env:prod` | Pulls that environment's settings into a gitignored `.env*.local` file |
| `npm run check` | Syntax-checks every server file and the dashboard script |
| `npm test` | Runs all test suites (`npm test -- calendars` runs one) |
| `npm run verify` | `check` plus `test`. Run before pushing. |
| `npm run cron:local` / `cron:prod` | Runs the checkpoint-email check once, as GitHub does every 30 minutes |
| `npm run deploy:preview` / `deploy:prod` | Deploys from your machine without a push |
| `npm run logs` | Streams production logs |

### Environments

Vercel keeps separate settings for **Production** (the live site), **Preview** (branch deploys and `deploy:preview`), and **Development** (your machine). Settings only apply to the environments whose boxes are checked in Vercel.

Keep test data out of your real record by giving Preview and Development their own database: in Vercel, open Storage, create a second Upstash Redis database, and connect it to Preview and Development only. `RESEND_API_KEY`, `TO_EMAIL`, `APP_PASSWORD` and the three secrets can be copied to those environments, ideally with different secret values.

The project is pinned to Node 24. If `node --version` shows something older, install Node 24 (for example `brew install node@24`).

## Setup

1. **Push this repo** to `mathcodes/day_by_datum`.
2. **Link it on Vercel** under Jon's Vercel Team. Framework preset: Other.
3. **Add storage**: in the project, open Storage, then Marketplace, and add **Upstash Redis** (free tier). It sets its own env vars.
4. **Add env vars** (Settings, then Environment Variables, Production). See `.env.example`.
   - `RESEND_API_KEY`: sending-access key
   - `TO_EMAIL`: your Resend signup email
   - `APP_SECRET`, `CRON_SECRET`, `READ_TOKEN`: each from `openssl rand -base64 48`
   - `APP_PASSWORD`: your dashboard password
5. **Redeploy** so the env vars take effect.
6. **Add GitHub secrets** (repo Settings, then Secrets and variables, then Actions):
   - `CRON_SECRET`: same value as in Vercel
   - `APP_URL`: your production URL, like `https://day-by-datum.vercel.app`
7. **Test**: sign in, open Commitments, and use Send a test. Then run the workflow once by hand (Actions, then Checkpoint emails, then Run workflow).

## Notes

- Scheduled workflows in a repo with no commits for 60 days get disabled by GitHub. Re-enable them in the Actions tab.
- On a private repo, the 30-minute schedule uses about 1,450 Actions minutes a month, under the 2,000 free.
- Rotate `READ_TOKEN` any time. It only grants read access.
- To send from your own domain later: verify it in Resend, then set `FROM_EMAIL`.
