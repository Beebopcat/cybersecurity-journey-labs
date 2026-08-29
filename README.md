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

## Certification track

**CompTIA A+ Core 1 → A+ Core 2 → Network+ → Security+**

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
_meta/
  LAB-TEMPLATE.md    the structure every lab follows
```

---

**Casey Shingledecker** · [github.com/Beebopcat](https://github.com/Beebopcat)
