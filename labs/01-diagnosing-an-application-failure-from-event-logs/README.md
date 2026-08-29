# Lab 01 — Diagnosing an Application Failure from Windows Event Logs

**Environment:** Windows 11 Home, 24H2-era build · consumer laptop
**Tools:** Event Viewer / `Get-WinEvent`, Windows Error Reporting, application logs, PowerShell 5.1
**Skills:** log correlation, root-cause analysis, hypothesis elimination, evidence-based reporting

---

## The problem

A desktop application "kept crashing." Windows would appear to restart it, features silently
stopped working, and dependent background services became unreachable.

The reported symptom and the actual fault turned out to be different things — which is the
whole point of this lab.

---

## Assumption vs. reality

| Assumption | Reality |
|---|---|
| The app is crashing | **It never crashed once.** Zero crash events in 14 days |
| It's a memory leak | Process tree held steady at 1.6–1.9 GB with 5–6 GB free |
| The machine is unstable | No hardware errors logged at all |

Chasing the stated symptom would have wasted the entire session.

---

## Method

### 1. Establish whether a crash actually occurred

Three independent sources have to agree before "it crashed" is a finding:

```powershell
# Application Error / hang / WER events, last 14 days
$since = (Get-Date).AddDays(-14)
Get-WinEvent -FilterHashtable @{
    LogName   = 'Application'
    StartTime = $since
    Id        = 1000,1001,1002,1026
} -MaxEvents 2000
```

Result for the target application: **0 events.** Windows Reliability History also had no entry.
An application that truly crashes leaves a trace in at least one of these. This one left none.

**Finding:** the symptom is real, but "crash" is the wrong word for it.

### 2. Don't be fooled by event volume

The 14-day window held **883 Windows Error Reporting entries**, which looks alarming until you
group them:

```powershell
$wer = Get-WinEvent -FilterHashtable @{
    LogName      = 'Application'
    StartTime    = $since
    Id           = 1001
    ProviderName = 'Windows Error Reporting'
} -MaxEvents 2000

$wer | ForEach-Object {
    ($_.Message -split "`n") | Where-Object { $_ -match '^Event Name:' }
} | Group-Object | Sort-Object Count -Descending
```

| Count | Event name | What it actually is |
|---|---|---|
| 793 | `crashpad_log` | Chromium crash-reporter bookkeeping — mostly a browser updater |
| 45 | `WinPBRDiag` | Recovery diagnostics |
| 9 | `RADAR_PRE_LEAK_64` | Genuine memory-leak reports — **none for the target app** |
| 1 | `APPCRASH` | A different application entirely |

**Lesson:** raw event count is not a severity signal. 883 events, ~0 relevant.

### 3. Follow the application's own logs

Vendor application logs carry far more context than the Windows event log. The failure was
explicit:

```
[app:start] Configuring platform service...
[error]    Startup failed: service not running. The service failed to start.
[warn]     Skipping auto-reinstall (service not running; a restart restores it)
[info]     Dispatching startup error: restart your computer to restore it.
```

The application had **already diagnosed itself.** Nobody had read the log.

### 4. Find why the service died

Working backwards from that timestamp through the deployment log:

```
AppX Deployment operation failed for package <app>
error 0x80073D02: Unable to install because the following apps need to be closed
```

`0x80073D02` = the package cannot be replaced because it is currently in use.

**Root cause:** the application auto-updates in place. The update cannot register while the
app is running. The failed registration leaves its companion service unregistered, and the
service cannot re-register until reboot.

### 5. Confirm causality, not coincidence

A timeline that lines up beats a plausible story:

| Time | Event |
|---|---|
| 05:54:50 | Package update fails — `0x80073D02` |
| 05:56:14 | Service reported not running |
| 05:56:19 | Application declares itself degraded |
| 05:56+ | Dependent subsystems begin failing |

Ninety seconds apart, in dependency order. The same failure had also occurred at 02:08 the
same morning — **recurring, not a one-off.**

### 6. Quantify the aftermath

With the service gone, the client retried its named pipe endlessly:

```
[app-client] resubscribe failed: ENOENT: connect to \\.\pipe\<service-endpoint> — the pipe does not exist
```

416 identical failures, one per second, forever. A hot retry loop with no backoff — worth
noting as a design observation independent of the root cause.

---

## Root cause

**An in-place application update that cannot complete while the application is running.**
The failed update deregisters a dependent Windows service; the service cannot restart without
a reboot; every downstream feature then fails in a way that *presents* as the app crashing.

## Remediation

1. **Restart** — the only action that restores the deregistered service.
2. **Fully exit the application before it updates** — from the tray, not by closing the window.
   Closing the window leaves the package locked and the update fails again. *This is the fix
   that stops recurrence; the reboot only repairs the current instance.*

## Verification

Post-reboot, measured rather than assumed:

| Check | Before | After |
|---|---|---|
| Service endpoint present | ✗ | ✓ |
| Dependent subsystem reachable | ✗ | ✓ |
| Free RAM | 5.6 GB | 7.9 GB |
| Commit charge | 16.8 / 20.4 GB (82%) | 13.9 / 33.2 GB (42%) |

The commit *limit* itself rose because Windows re-sized the system-managed page file on restart —
the ceiling moved, not just the usage under it. Worth noting so the improvement isn't misread as
the reboot having freed 13 GB of RAM.

---

## Incidental finding: a runaway process

While profiling, one system process showed an implausible CPU total. Rather than estimate from
a single reading, I sampled it:

```powershell
$a = (Get-Process TextInputHost).CPU
Start-Sleep -Seconds 10
$b = (Get-Process TextInputHost).CPU
"{0:N0}% of one core" -f ((($b - $a) / 10) * 100)
```

**Result: 98% of one core, sustained** — 13,603 CPU-seconds accumulated over 18 hours of
uptime. A known Windows input-host defect, unrelated to the primary fault. Terminating it is
safe; the process respawns on demand and came back at 0.9s.

**Lesson:** a cumulative counter tells you *that* something is wrong. A rate measurement tells
you *how* wrong. Always sample twice before acting.

---

## Takeaways

1. **Verify the symptom before investigating it.** "It's crashing" was false, and the whole
   investigation would have gone the wrong direction on trust.
2. **Read the application's own log first.** It had already printed the answer and the remedy.
3. **Volume is not severity.** 883 error reports contained zero relevant events.
4. **Correlate timestamps to establish causality.** Ninety seconds and dependency order is
   evidence; "these both look broken" is not.
5. **Distinguish the repair from the fix.** Rebooting restored service. Changing the update
   habit is what stops it recurring.
6. **Measure rates, not totals.**

---

## Sanitisation note

The working version of this diagnosis contained the machine's hostname, account name, full
filesystem paths, hardware inventory, and a list of that host's security weaknesses. Useful
internally. Reckless to publish — it is a map for anyone who wants one.

This writeup keeps the method and drops the host. Deciding what to strip *is part of the work*,
not an afterthought to it.
