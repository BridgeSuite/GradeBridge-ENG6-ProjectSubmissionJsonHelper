# GradeBridge — ENG6 Project Submission JSON Helper

A single-page web app that guides students through filling in their `submission.json` for the ENG6 final project Gradescope submission. Validates all fields before download and shows a live JSON preview.

**Live:** https://veriqai.github.io/GradeBridge-ENG6-ProjectSubmissionJsonHelper/

---

## What it collects

| Field | Validation |
|---|---|
| Team ID | T + 2–3 digits (T prefix added automatically) |
| Track | A or B |
| Team members (1–4) | Full name + 9-digit student ID |
| Entry point | Filename ending in `.m` or `.mlapp`; no path |
| ThingSpeak channel URL | Must be `thingspeak.com`; channel ID auto-extracted |
| ThingSpeak channel ID | Integer; auto-filled from URL |
| ThingSpeak read API key | Non-empty |
| YouTube URL | Must be `youtube.com` or `youtu.be` |
| Notes | Optional |

The downloaded `submission.json` matches the schema enforced by the Gradescope autograder.

---

## Local development

```bash
npm install
npm run dev
# → http://localhost:5173/GradeBridge-ENG6-ProjectSubmissionJsonHelper/
```

## Deploy to GitHub Pages

```bash
npm run deploy
```

Builds the app and force-pushes `dist/` to the `gh-pages` branch. Uses a direct git push (not the `gh-pages` npm package) to avoid Windows MAX_PATH issues with the long repo name.

---

## Stack

React 18 · TypeScript · Vite 5 · no external UI dependencies
