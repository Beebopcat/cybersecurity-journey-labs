# Lab 07 — Home Lab: Sysmon With the SwiftOnSecurity Config, and Optional Atomic Red Team Tests

> **STATUS: PLANNED, NOT YET PERFORMED.** Nothing below has been run. The results section is a blank template. I will fill it in only with what I actually observe, and I will change this status line when I do.

**Environment:** the Windows 11 VM from [Lab 06](../06-home-lab-windows-log-triage/PLAN.md) (isolated, snapshot first)
**Tools (all free):** Sysinternals Sysmon, the SwiftOnSecurity `sysmon-config` file, Event Viewer, PowerShell `Get-WinEvent`; optional Atomic Red Team (Invoke-AtomicRedTeam)
**Skills:** endpoint telemetry, process and network event analysis, mapping events to MITRE ATT&CK techniques (T1059 command and scripting interpreter, T1053 scheduled task/job), comparing what different log sources show, safe cleanup

**Why this lab:** Windows' built-in logs say a process started; Sysmon adds the parent process, full command line, file hashes, network connections and DNS lookups. Seeing the same activity in both is the quickest way to understand what a SOC analyst actually has to work with.

---

## 0. Safety rules

- **VM only.** Never install Atomic Red Team or run its tests on your main computer. These tests imitate attacker behaviour and security software will flag them.
- Snapshot the VM as `before-lab07`. Use NAT or host-only networking.
- Read each Atomic test's description (`-ShowDetails`) **before** running it, and run `-Cleanup` after.
- The Atomic Red Team part is **optional**. The Sysmon part stands on its own.
- Download only from the official pages (Microsoft Sysinternals; the SwiftOnSecurity and Red Canary GitHub repositories) and record the file hashes.
- Do not commit the Sysmon config or any tool into this repo; link to it. Raw `.evtx` exports stay local.

**VM guard.** Paste this as the **first line** of every elevated PowerShell session and script in this lab. It stops everything unless the machine reports itself as a virtual machine:

```powershell
if ((Get-CimInstance Win32_ComputerSystem).Model -notmatch 'Virtual|VMware|VirtualBox|Hyper-V') { throw "Not a VM. Aborting." }
```

## 1. Download and verify

1. Sysmon: Microsoft Learn > Sysinternals > Sysmon download page. Save and extract to `C:\Lab\Sysmon`.
2. Config: the `sysmonconfig-export.xml` file from github.com/SwiftOnSecurity/sysmon-config. Save in the same folder. It is a well-known starter template, not a complete detection set; credit the author when you write about it.
3. Verify and record:

```powershell
Get-FileHash C:\Lab\Sysmon\Sysmon64.exe -Algorithm SHA256
Get-AuthenticodeSignature C:\Lab\Sysmon\Sysmon64.exe | Select-Object Status, SignerCertificate
```

Expected: `Status` is `Valid` and the signer is Microsoft. If not, stop and re-download.

## 2. Install Sysmon with the config

**Newer Windows 11 option.** Recent Windows 11 builds include Sysmon as an optional Windows feature (Settings > System > Optional features > More Windows features, or `Dism /Online /Enable-Feature /FeatureName:Sysmon`, then `sysmon -i`). It must not coexist with a Sysinternals install, and the update that delivers it varies by build, so check Microsoft Learn first. This plan uses the downloaded Sysinternals version, which works on any Windows 11 build; note which you used in the results.

**Config choice.** The SwiftOnSecurity config is the classic, readable starter. **sysmon-modular** (github.com/olafhartong/sysmon-modular) is a newer alternative that maps its rules to MITRE ATT&CK and is maintained as separate modules. Start with SwiftOnSecurity; try sysmon-modular afterwards and compare the event volume.

In an elevated PowerShell:

```powershell
cd C:\Lab\Sysmon
.\Sysmon64.exe -accepteula -i .\sysmonconfig-export.xml
Get-Service Sysmon64
.\Sysmon64.exe -c        # prints the running configuration
```

The log is **Applications and Services Logs > Microsoft > Windows > Sysmon > Operational**.

Event IDs to know: **1** process created · **3** network connection · **7** image (DLL) loaded · **8** remote thread created · **10** process accessed · **11** file created · **12/13/14** registry events · **22** DNS query.

## 3. Establish a baseline (10 minutes)

Use the VM normally for ten minutes (open Edge, a folder, PowerShell). Then:

```powershell
$log = 'Microsoft-Windows-Sysmon/Operational'
Get-WinEvent -LogName $log -MaxEvents 2000 | Group-Object Id | Sort-Object Count -Descending | Select-Object Count, Name
```

Record the counts. This is "normal noise"; you need it to recognise abnormal.

## 4. Manual tests (no attack tools)

1. In PowerShell run `whoami`, `hostname`, `ipconfig`, then `Invoke-WebRequest https://example.com -UseBasicParsing | Out-Null`.
2. Find the Event ID 1 for each. Record **Image**, **CommandLine**, **ParentImage**, **User**, **Hashes**.
3. Find the DNS (22) and network (3) events for the web request. If one is missing, the config filters it out; read the XML rules to see why. That is a real lesson about tuning noise.
4. Create a file on the Desktop and find Event ID 11.

```powershell
Get-WinEvent -FilterHashtable @{LogName=$log; Id=1; StartTime=(Get-Date).AddMinutes(-15)} | ForEach-Object {
  $d=@{}; ([xml]$_.ToXml()).Event.EventData.Data | ForEach-Object { $d[$_.Name]=$_.'#text' }
  [pscustomobject]@{Time=$_.TimeCreated; Image=$d.Image; Cmd=$d.CommandLine; Parent=$d.ParentImage }
} | Format-Table -AutoSize -Wrap
```

## 5. Optional: Atomic Red Team, T1059 and T1053

Atomic Red Team is Red Canary's open-source library of small, documented tests mapped to MITRE ATT&CK.

1. **Defender will interfere.** Inside the VM only, create an exclusion for the Atomic folder (this changes a security setting; that is why it is VM-only):

```powershell
Add-MpPreference -ExclusionPath 'C:\AtomicRedTeam'
```

2. Install using the method in the official Red Canary instructions (github.com/redcanaryco/invoke-atomicredteam). It downloads and runs a script from the official repository, which is why it is VM-only. Better still, save the script, read it, then run it:

```powershell
IEX (IWR 'https://raw.githubusercontent.com/redcanaryco/invoke-atomicredteam/master/install-atomicredteam.ps1' -UseBasicParsing)
Install-AtomicRedTeam -getAtomics
Import-Module 'C:\AtomicRedTeam\invoke-atomicredteam\Invoke-AtomicRedTeam.psd1' -Force
```

3. List what exists and read what each test does. **Test numbers change between library versions: never run a test by number without reading its name and details first.**

```powershell
Invoke-AtomicTest T1059.001 -ShowDetailsBrief     # PowerShell
Invoke-AtomicTest T1053.005 -ShowDetailsBrief     # Scheduled Task
```

4. **Safe tests only.** Run a test only if `-ShowDetails` shows that it runs local commands and nothing else.
   - **T1059.001 (PowerShell):** choose a test that only runs a local command, such as an encoded or parameter-variation command that prints text. **Avoid** anything that downloads and runs code (download cradles, `IEX` from a URL) and anything named Mimikatz, BloodHound/SharpHound, PowerUp or "Invoke-AllChecks". At the time of writing, the first test in the T1059.001 list has been the Mimikatz one, which downloads a credential-dumping tool. Do not run it.
   - **T1053.005 (scheduled task):** choose a test that creates a task locally with `schtasks.exe` (or the PowerShell scheduled-task cmdlets) and has a cleanup step that deletes it. Skip tests that need a remote host.
   - If no list item is clearly safe, use the manual equivalents instead: `powershell -EncodedCommand <base64 of Write-Output hello>` for T1059.001, and `schtasks /create` then `schtasks /delete` (as in Lab 06) for T1053.005.
5. Check prerequisites, run the chosen test, then clean up:

```powershell
Invoke-AtomicTest T1053.005 -TestNumbers <n> -CheckPrereqs
Invoke-AtomicTest T1053.005 -TestNumbers <n>
Invoke-AtomicTest T1053.005 -TestNumbers <n> -Cleanup
# repeat for T1059.001, using the test you chose after reading it
```

6. For each test, record what **each** log source showed for the same minute:

| Source | What to look for |
|---|---|
| Sysmon 1 | `powershell.exe` or `schtasks.exe` with its command line and parent process |
| Sysmon 11 / 13 | files written; registry keys set |
| Sysmon 3 / 22 | network or DNS activity |
| Security 4688 / 4698 | process creation with command line (Lab 06 setup); scheduled task created |
| PowerShell Operational 4104 | script block text (enable script block logging in Group Policy first) |

7. Write one detection idea per technique (for example: `schtasks.exe` with `/create` launched by `powershell.exe` or `cmd.exe`). Note the false positives you can think of.

## 6. Clean up

```powershell
.\Sysmon64.exe -u                       # uninstall Sysmon
Remove-MpPreference -ExclusionPath 'C:\AtomicRedTeam'
Remove-Item C:\AtomicRedTeam -Recurse -Force
```

Revert to `before-lab07` if you prefer a clean slate.

---

## Results template (fill in after running; leave blank until then)

**Date run:** ____  **VM / Windows build:** ____  **Sysmon version:** ____  **Config file date/commit:** ____
**Sysmon64.exe SHA-256:** ____  **Signature status:** ____

**Baseline (10 min), top event IDs and counts:** ____

| Manual test | Event ID found | Image / CommandLine / Parent | Notes |
|---|---|---|---|
| `whoami` | | | |
| web request (DNS 22, network 3) | | | |
| file create (11) | | | |

| ATT&CK technique | Atomic test name and number | Sysmon events | Windows Security events | PowerShell 4104 | Cleanup done? |
|---|---|---|---|---|---|
| T1059.001 | | | | | |
| T1053.005 | | | | | |

**One detection idea per technique, with likely false positives:**

1. ____
2. ____

**What the config filtered out that I expected to see:** ____

**What surprised me / what I got wrong first:** ____

**Takeaways (what transfers to the next problem):**

1. ____
2. ____
3. ____

## References (free)

- Microsoft Learn, Sysinternals Sysmon documentation.
- SwiftOnSecurity, `sysmon-config` (GitHub).
- Red Canary, Atomic Red Team and Invoke-AtomicRedTeam (GitHub).
- MITRE ATT&CK: T1059 Command and Scripting Interpreter; T1053 Scheduled Task/Job.
