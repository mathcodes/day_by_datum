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
