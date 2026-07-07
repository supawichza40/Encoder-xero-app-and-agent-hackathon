# Hackathon Template

A battle-tested starter kit distilled from a measured retrospective of the Xero App & Agent Hackathon (4–5 July 2026): 101 commits, 32 Claude sessions, and the recorded finalist pitches were forensically analyzed. Result there: ~top 20 of 61, not top 10. Every rule in this kit exists because skipping it demonstrably cost points.

## What's in the box

| File | What it enforces | When it's used |
|---|---|---|
| `CLAUDE.md` | Operating rules every Claude Code session follows | Loaded automatically, all weekend |
| `DESIGN.md` | Frontend design rules Claude follows | Referenced by every UI task |
| `PLAYBOOK.md` | The T+0 → T+48 phase sequence with hard gates | Read at each phase boundary |
| `RUBRIC.md` | Judging reverse-engineering (fill in hour 0) | Hour 0, then every scope decision |
| `SPECS.md` | The 8-document spec architecture Claude fills at spec lock | Phase 2, one burst |
| `PITCH.md` | 3-minute pitch skeleton + judge Q&A bank | Started day 1, rehearsed day 2 |
| `SUBMISSION.md` | Submission checklist with time gates | Draft pushed day 1 |
| `PREFLIGHT.md` | External tool/API viability spikes | Hour 0–5, before idea lock |
| `SOLO-OPS.md` | Solo multi-session operating model (lanes, rotation, session count per phase) | When running the event alone |
| `PROMPTS.md` | Copy-paste prompt per phase — the steering wheel for the whole process | P0 at kickoff, then per phase |
| `WALKTHROUGH.md` | Simulated run: what each phase looks like on screen + the three parallelism modes | Read before your first event |
| `RETRO.md` | The compounding loop: post-event forensics → patch the template → version-tag · plus the pre-event dry run | Within 48h after every event |
| `TODO.md` | Status board (agent updates, human reads) | Continuous |
| `BACKLOG.md` | Parking lot for post-lock ideas | After spec lock |
| `.gitignore` | Clean tree from minute 1 | Hour 0 |
| `.claude/settings.json` | Session-start hook that surfaces the status board | Automatic |

## Hour-0 ritual (30 minutes, hard cap)

```
1. Clone this template OUTSIDE any sync folder (NOT iCloud/Dropbox/OneDrive —
   iCloud produced 0-byte conflict-duplicate files mid-event last time).
2. git init (or push to the new private repo) · verify `git status` is clean.
   If you ever add a .gitignore entry for already-tracked files:
   git rm -r --cached <path> in the SAME commit (22 .pyc files stayed dirty
   for an entire event because this step was skipped).
3. Fill RUBRIC.md: stated weights, track sentences VERBATIM, judge names/roles,
   submission requirements. Photograph every slide that mentions judging.
4. Create the real submission-portal draft NOW if the portal is open.
5. First commit + push. Remote URL confirmed reachable.
```

Then open `PLAYBOOK.md` and follow the gates. Do not skip the exploration phase; do not extend it either.

## The three lessons this template exists to enforce

1. **Push == done.** The strongest work of the last event (199-test narrative, screenshots) never left the laptop — judges saw the stale version.
2. **Real before mocked.** 100% of Xero calls were mocked until 5 hours before the deadline; the live connection instantly exposed two structural bugs green tests could never catch.
3. **The pitch layer decides.** The recorded winners led on: real niche with a face, track-sentence fit, one live wow moment, and a clean 3 minutes — not on architecture or test counts.
