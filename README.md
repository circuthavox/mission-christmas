# Mission: Christmas

A reusable, offline-capable Advent challenge PWA. It uses plain HTML, CSS and JavaScript, a separate JSON challenge library, and browser `localStorage`.

## Run locally

A service worker requires HTTP(S), so do not open `index.html` directly from the filesystem.

- Python: `python3 -m http.server 8000`
- Then visit `http://localhost:8000`

Or deploy the folder to any static host that serves HTTPS (GitHub Pages, Netlify, Cloudflare Pages, etc.).

## Annual seasons and scoring

On first visit in a calendar year, the app shuffles the 1,000-entry database and saves 25 unique assignments for that year. Refreshing does not change them. A new year receives a new selection. Each day unlocks at midnight on its assigned December date in the device's local time zone. Earlier seasons can be selected from Settings after they exist.

Results can be recorded once per day. Success adds the listed coin value; failure subtracts it. The score is classified in the normal interface until December 25 local time. This is a casual honour-system game, not tamper-proof: browser storage can be inspected or edited.

## Preview/testing dates

Open Settings and use **Preview date** to simulate a local calendar date, for example `2026-12-25`. Clear the field and apply to return to the actual device date. This date abstraction is intended for testing unlocks and the finale. The app uses local date components, not UTC date boundaries.

## Data and privacy

- `data/challenges.json` contains the 1,000 challenge records, separate from application code.
- `localStorage` key: `missionChristmas_v1` (versioned structure).
- There is no account, backend, analytics or server-side score storage.
- `localStorage` does **not** synchronise between different devices, browsers or browser profiles. Clearing browser data can erase game progress. Export/backup is not currently built in.

## Offline and installation

The service worker caches the app shell and the challenge JSON after the first successful online load. The app then works offline on that browser/device. Install through the browser's Add to Home Screen / Install App option. iOS Safari supports Add to Home Screen; Android Chrome and desktop Chromium browsers support their respective install flows. The Google Fonts import is optional decoration; the system font fallbacks keep the interface usable if fonts are unavailable offline.

## Project files

- `index.html` — app structure
- `styles.css` — responsive visual design
- `app.js` — annual assignment, calendar, result recording and reveal
- `data/challenges.json` — 1,000 challenge records
- `manifest.json` — PWA metadata
- `sw.js` — offline caching
- `assets/` — application icons and favicon

## Validation

The delivered challenge database is generated as 1,000 records with sequential unique IDs and unique titles. The app checks the database record count on startup. For a production audit, run:

```bash
python3 - <<'PY'
import json
data=json.load(open('data/challenges.json'))
assert len(data)==1000
assert len({x['id'] for x in data})==1000
assert len({x['title'] for x in data})==1000
required={'id','title','category','description','instructions','items','difficulty','coins','estimatedMinutes','indoor','requiresPurchase'}
assert all(required <= x.keys() and all(x[k] not in (None,'',[]) for k in required) for x in data)
print('Validated:',len(data),'challenges')
PY
```
