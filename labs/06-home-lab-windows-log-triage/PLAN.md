# Lab 06 — Home Lab: Windows Log Triage (Event Viewer and PowerShell)

> **STATUS: PLANNED, NOT YET PERFORMED.** Nothing below has been run. The results section is a blank template. I will fill it in only with what I actually observe, and I will change this status line when I do.

**Environment:** Windows 11 virtual machine on my own computer (isolated, snapshot first)
**Tools (all free):** Event Viewer, PowerShell 5.1 `Get-WinEvent`, `auditpol`, built-in Windows tools
**Skills:** knowing which event IDs matter, generating known events on purpose, filtering logs with PowerShell, triage by who / what / where / when, writing a short finding

**Why this lab:** it builds on [Lab 01](../01-diagnosing-an-application-failure-from-event-logs/) (reading logs to find a cause) and turns it toward security questions a help-desk or SOC analyst gets: did someone try to guess a password, was an account created, did a scheduled task or service appear?

---

## 0. Safety rules

- Use a **VM only**, never the host machine. Free options: VirtualBox, or VMware Workstation (free for personal use). Hyper-V is not available on Windows 11 Home.
- Windows 11 Enterprise **evaluation** ISO (time-limited) from the Microsoft Evaluation Center, or a licensed copy of your own.
- Network: NAT or host-only. No shared folders, no clipboard sharing.
- Take a snapshot named `clean` before you start and another named `after-lab06` at the end.
- Everything created (a test user, a task, a service) is **fake and local**. Use a throwaway password and never reuse a real one.
- Raw `.evtx` exports stay local (they are already in the repo's `.gitignore`). Publish only sanitised excerpts.

## 1. Build the VM (about 30 minutes)

1. Create a VM with 4 GB RAM, 2 CPUs, 60 GB disk. Install Windows 11 with a local account called `labadmin`.
2. Install updates once, then snapshot as `clean`.
3. Open **PowerShell as Administrator** for everything below.

## 2. Turn on the logging you need

By default Windows does not record everything. Enable it and write down what you changed.

```powershell
# Process creation (event 4688) with command lines
auditpol /set /subcategory:"Process Creation" /success:enable
New-Item -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit' -Force | Out-Null
Set-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System\Audit' -Name ProcessCreationIncludeCmdLine_Enabled -Value 1 -Type DWord

# Logon success and failure (4624, 4625)
auditpol /set /subcategory:"Logon" /success:enable /failure:enable

# Account management (4720 user created, 4732 group member added)
auditpol /set /subcategory:"User Account Management" /success:enable /failure:enable
auditpol /set /subcategory:"Security Group Management" /success:enable /failure:enable

# Scheduled task created (4698)
auditpol /set /subcategory:"Other Object Access Events" /success:enable
```

Check: `auditpol /get /category:*` and keep the output (no hostnames in it, but look before you paste it anywhere).

## 3. Generate known events on purpose

Do each step, then write the time down in the results template.

| Step | Command | Event you expect |
|---|---|---|
| A. Failed logons | `1..5 \| % { net use \\localhost\IPC$ /user:labtest WrongPass$_ 2>$null }` | 4625 in Security, five of them |
| B. New user | `net user labuser 'T3st-Only!234' /add` | 4720 |
| C. Add to group | `net localgroup Administrators labuser /add` (VM only; a new local user is already in Users) | 4732 |
| D. Scheduled task | `schtasks /create /tn LabTask /tr "cmd.exe /c echo lab" /sc once /st 23:59` | 4698 (and the TaskScheduler log, if enabled) |
| E. New service | `sc.exe create LabSvc binPath= "C:\Windows\System32\cmd.exe /c echo lab"` | 7045 in System |
| F. Successful logon | sign out and back in as `labadmin` | 4624 (note LogonType) |

Tip for step A: `labtest` does not exist, so you will also see which status code Windows logs for an unknown user. Compare with a real user and a wrong password.

## 4. Look in Event Viewer first

1. Open **Event Viewer > Windows Logs > Security**. Use **Filter Current Log** with event IDs `4624,4625,4688,4698,4720,4732`.
2. Save that filter as a **Custom View** called `lab06-security`.
3. Open one event of each ID. Note the fields that matter: account, logon type, source address, process, command line.

## 5. Then do the same with PowerShell

```powershell
$since = (Get-Date).AddHours(-2)

# 5.1 Count events by ID in the last two hours
Get-WinEvent -FilterHashtable @{LogName='Security'; StartTime=$since} |
  Group-Object Id | Sort-Object Count -Descending | Select-Object Count, Name -First 15

# 5.2 Failed logons, with the fields that matter
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4625; StartTime=$since} | ForEach-Object {
  $d = @{}; ([xml]$_.ToXml()).Event.EventData.Data | ForEach-Object { $d[$_.Name] = $_.'#text' }
  [pscustomobject]@{ Time=$_.TimeCreated; User=$d.TargetUserName; LogonType=$d.LogonType
                     Source=$d.IpAddress; Status=$d.Status; SubStatus=$d.SubStatus }
}

# 5.3 Did a success follow the failures? (possible guessed password)
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624,4625; StartTime=$since} |
  Sort-Object TimeCreated | Select-Object TimeCreated, Id -First 30

# 5.4 New accounts, group changes, tasks and services
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4720,4732,4698; StartTime=$since}
Get-WinEvent -FilterHashtable @{LogName='System'; Id=7045; StartTime=$since}

# 5.5 Process creation with command line
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4688; StartTime=$since} |
  Where-Object Message -match 'schtasks|sc.exe|net.exe' | Select-Object TimeCreated, Message -First 5
```

## 6. Triage the way an analyst would

For each finding, answer in one line: **Who** (account) · **What** (event and ID) · **Where** (host, source address) · **When** (first and last time) · **Expected?** (yes/no/unknown) · **Next step**.

Practise three judgements:

1. Is a burst of 4625 a user who forgot a password or a guessing attempt? (Look at count, timing, usernames tried, source.)
2. Is a 4624 with LogonType 10 or 3 expected for this machine?
3. Would you escalate a new local user plus a new scheduled task in the same minute? Why?

## 7. Clean up

```powershell
schtasks /delete /tn LabTask /f
sc.exe delete LabSvc
net user labuser /delete
```

Then revert to the `clean` snapshot or keep `after-lab06` for Lab 07.

---

## Results template (fill in after running; leave blank until then)

**Date run:** ____  **VM / Windows build:** ____  **Time spent:** ____

| Step | Command run (exact) | Time | Event ID seen | Fields recorded | Matched expectation? |
|---|---|---|---|---|---|
| A Failed logons | | | | | |
| B New user | | | | | |
| C Group add | | | | | |
| D Scheduled task | | | | | |
| E New service | | | | | |
| F Successful logon | | | | | |

**Status codes I saw for 4625 (unknown user vs wrong password):** ____

**Triage notes (one line per finding):**

1. ____
2. ____
3. ____

**What surprised me / what I got wrong first:** ____

**What I would change in the logging setup:** ____

**Sanitised evidence added (file names, redacted fields listed):** ____

**Takeaways (numbered, what transfers to the next problem):**

1. ____
2. ____
3. ____

## References (free)

- Microsoft Learn, "Advanced security audit policy settings" and the Security event ID reference.
- Microsoft Learn, `Get-WinEvent` and "Creating Get-WinEvent queries with FilterHashtable".
