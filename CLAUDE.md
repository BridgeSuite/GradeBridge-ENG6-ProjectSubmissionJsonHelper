# GradeBridge — ENG6 Project Submission JSON Helper

## What This App Is

A single-page form that guides ENG6 students through filling in their `submission.json` for the final project Gradescope autograder. Students hand-editing the JSON template make frequent errors (wrong types, missing fields, malformed URLs); this app validates every field before download and shows a live JSON preview so they see exactly what will be submitted.

**Live:** https://veriqai.github.io/GradeBridge-ENG6-ProjectSubmissionJsonHelper/
**Repo:** VeriQAi/GradeBridge-ENG6-ProjectSubmissionJsonHelper

---

## Key Files

```
GradeBridge-ENG6-ProjectSubmissionJsonHelper\
├── CLAUDE.md              ← this file
├── README.md              ← developer/deploy docs
├── index.html             ← page title: "ENG6 — Project Submission Helper"
├── package.json           ← deploy script: direct dist→gh-pages push (see Deploy note)
├── vite.config.ts         ← base: '/GradeBridge-ENG6-ProjectSubmissionJsonHelper/'
└── src\
    ├── main.tsx           ← React entry point
    ├── App.tsx            ← entire app: form, validation, JSON builder, preview, download
    └── index.css          ← minimal reset + responsive breakpoint (≤800px stacks columns)
```

All logic is in `src/App.tsx` — no separate services or types files.

---

## submission.json Schema

```json
{
  "team_id": "T07",
  "members": [
    { "name": "First Last", "student_id": "912345678" }
  ],
  "track": "A",
  "entry_point": "main.m",
  "thingspeak": {
    "channel_url": "https://thingspeak.com/channels/1234567",
    "channel_id": 1234567,
    "read_key": "XXXXXXXXXXXXXXXX"
  },
  "youtube_url": "https://www.youtube.com/watch?v=...",
  "notes": ""
}
```

`channel_id` is a JSON integer (not a string). `team_id` always has the `T` prefix. These are the two most common hand-editing mistakes.

---

## Validation Rules

| Field | Rule |
|---|---|
| team_id | 2–3 digits; T prefix added automatically by the app |
| members | 1–4 entries; name non-empty; student_id exactly 9 digits |
| track | Must be A or B |
| entry_point | Ends in `.m` or `.mlapp`; no path separators |
| channel_url | Valid URL on `thingspeak.com` |
| channel_id | Positive integer; auto-extracted from channel_url |
| read_key | Non-empty |
| youtube_url | Valid URL on `youtube.com` or `youtu.be` |
| notes | Optional, no validation |

Errors only appear after the student first clicks **Download submission.json**. After that, errors clear field-by-field as the student fixes them (both top-level fields and per-member fields).

---

## UX Details

- **T prefix**: the Team ID input shows a grey `T` badge fused to the left; student types digits only; non-numeric characters are stripped on input
- **Channel ID auto-fill**: when the student pastes a ThingSpeak URL, the channel ID is extracted from the path (`/channels/1234567`) and populated automatically
- **Live preview**: dark panel on the right updates on every keystroke; shows placeholder values (e.g. `T??`, `0`) for empty required fields so the schema is always visible
- **Member rows**: start at 2, add up to 4, remove down to 1; each row clears its own errors as the student types

---

## Local Development

```bash
npm install
npm run dev
# → http://localhost:5173/GradeBridge-ENG6-ProjectSubmissionJsonHelper/
```

## Deploy

```bash
npm run deploy
```

**Important:** the `gh-pages` npm package cannot be used here — the repo name is long enough that its cache path exceeds the Windows MAX_PATH limit (260 chars). The deploy script instead builds `dist/` and pushes it directly to the `gh-pages` branch using a temporary git repo inside `dist/`:

```
npm run build && cd dist && git init -b gh-pages && git add -A && git commit -m Deploy && git push -f git@github.com:VeriQAi/GradeBridge-ENG6-ProjectSubmissionJsonHelper.git gh-pages
```

Do not replace this with `gh-pages -d dist` — it will fail with a filename-too-long error on Windows.

---

## What This App Does NOT Do

- No encryption — the output JSON is plain text (unlike lab pipeline submissions which use AES-256-GCM)
- No assignment loading — the schema is hardcoded, not loaded from an instructor-exported file
- No PDF generation
- Not connected to Gradescope — students still upload manually
