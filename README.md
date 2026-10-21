# Cybersecurity Journey — Labs

Hands-on lab work documented as I move from IT fundamentals toward a SOC analyst role.

Every entry here follows the same rule: **a real problem, a documented method, and a verified
result.** No tutorial walkthroughs copied from a course. If a lab is here, I did the work and
I can defend every claim in it.

---

## Why this repo exists

Certificates prove you passed a test. This proves you can work a problem.

Each writeup shows the reasoning — including the wrong turns, because narrowing down a false
lead is most of what troubleshooting actually is. A lab that reads as though I knew the answer
from the start would be a less honest document and a less useful one.

---

## Labs

| # | Lab | Skills | Status |
|---|---|---|---|
| 01 | [Diagnosing an application failure from Windows Event Logs](labs/01-diagnosing-an-application-failure-from-event-logs/) | Event Viewer, WER, PowerShell, root-cause analysis | ✅ Complete |

*More landing as I work through A+ Core 1.*

---

## AI-assisted learning projects

These components support learning and are separate from the independently documented lab writeups above.

- [Offline permissions simulator](projects/permissions-simulator/) — fictional in-memory exercises, bounded command parsing, policy evaluation, and **10 passing automated tests**. Source and test fixtures are included. This component does not execute a real shell or modify host permissions.

---

## Media: the permissions simulator in the browser

A browser sample UI of the offline permissions simulator is live at [https://beebopcat.github.io/public-demos/permissions/](https://beebopcat.github.io/public-demos/permissions/) (also on [caseyshingledecker.com](https://caseyshingledecker.com/demos/permissions/index.html)). It is a simulation only: not Linux, not a shell and not a VM, and it executes no commands on the host. The sample UI is hosted in the [public-demos](https://github.com/Beebopcat/public-demos) repository; the authoritative implementation and its 10 tests are in `projects/permissions-simulator/`.

### Screenshots

| | |
|:--:|:--:|
| ![Linux permissions simulator at its starting state, with mode bits 0600, a command field and the output log reading Sample UI ready.](docs/media/permissions/01.webp) | ![After Run on chmod g+r, mode bits show 0640 and the output reports owner kept, group read and visitor denied.](docs/media/permissions/02.webp) |
| <sub>Linux permissions simulator at its starting state, with mode bits 0600, a command field and the output log reading Sample UI ready.</sub> | <sub>After Run on chmod g+r, mode bits show 0640 and the output reports owner kept, group read and visitor denied.</sub> |
| ![After chmod o-r and Run, the output log lists repeated sample result lines with mode 0640.](docs/media/permissions/03.webp) | ![After ls -l supply-ledger.txt is run, the output log shows the same sample result lines.](docs/media/permissions/04.webp) |
| <sub>After chmod o-r and Run, the output log lists repeated sample result lines with mode 0640.</sub> | <sub>After ls -l supply-ledger.txt is run, the output log shows the same sample result lines.</sub> |

#### Video

[![Linux permissions simulator at its starting state, with mode bits 0600, a command field and the output log reading Sample UI ready.](docs/media/permissions/poster.webp)](docs/media/permissions/clip.mp4)

---

## Certification track

**CompTIA A+ Core 1 → A+ Core 2 → Network+ → Security+ → CySA+**

A+ Core 1 is in progress; the remaining certifications are planned.

Sequenced on purpose. Security+ assumes networking fluency it does not teach, so I'm building the
foundation before the credential that depends on it.

---

## A note on what is *not* in this repo

No packet captures, event-log exports, memory dumps, hostnames, usernames, internal IP
addresses, or configuration files from live systems — including my own.

Lab writeups are **sanitised by default**. The methodology is the transferable part; the host
detail is a liability to whoever's host it is. Raw artifacts stay local and are excluded by
[`.gitignore`](.gitignore).

That distinction — *internal diagnostics and published writeups are different documents* —
was itself a lesson from Lab 01.

---

## Structure

```
labs/
  NN-short-descriptive-name/
    README.md        the writeup
    evidence/        sanitised excerpts only
projects/
  permissions-simulator/
    README.md        scope, examples, and verification
    *.mjs            implementation and tests
    fixtures.json    fictional exercise data
_meta/
  LAB-TEMPLATE.md    the structure every lab follows
```

---

**Casey Shingledecker** · [github.com/Beebopcat](https://github.com/Beebopcat)
