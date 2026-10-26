# Course analysis: Lab 03 — SolarWinds 2020: When the Trusted Update Is the Attack

**Environment:** Desk research. No systems were touched and none were tested.
**Tools:** US GAO and CISA publications, Microsoft and FireEye technical write-ups, NIST NVD entry for CVE-2020-10148, MITRE ATT&CK
**Skills:** supply-chain risk, reading vendor threat research, timeline building, separating two related vulnerabilities, writing for leadership

**What this is, honestly:** a course exercise from my Chegg Skills cybersecurity certificate. I wrote a short leadership briefing deck on a *public* incident using public sources. It is analysis, not a hands-on lab. Research and editing help from AI tools was disclosed in the course submission; the reading, analysis and writing are mine.

---

## The problem

Attackers got malicious code into software update packages that thousands of organisations trusted and installed on purpose. The leadership question: *how do you defend against something that arrives signed, from your own vendor, through your own patching process?*

---

## Assumption vs. reality

| Assumption | Reality |
|---|---|
| "A signed update is a safe update" | The malicious DLL was signed with SolarWinds' own certificate. Microsoft concluded the code was inserted before the final build and signing stages, so the signature vouched for tampered code. |
| Every customer who installed it was breached | About 18,000 customers received a compromised update (SolarWinds' estimate, quoted by GAO). The attackers chose a much smaller set of high-value targets to go further, including US federal agencies. |
| This was an Orion vulnerability that should have been patched | SUNBURST was not a vulnerability. It was planted code. CVE-2020-10148 is a **separate** Orion API flaw (authentication bypass); it is a good reminder that management tools need fast patching, but it is not how SUNBURST arrived. |
| It would have been noisy | The backdoor waited roughly 12 to 14 days before calling out, avoided hosts running analysis tools and mimicked normal Orion traffic. |

---

## Method

1. Read government sources (GAO, CISA, NVD) for the facts, and vendor research (Microsoft, FireEye) for technical detail.
2. Keep two lists apart: *how the attackers got in* (build and distribution) and *what customers could have done* (inventory, monitoring, privilege).
3. Keep SUNBURST and CVE-2020-10148 separate: they are different attack paths.
4. Write six recommendations a manager can act on.

---

## What happened (timeline)

| When | Event | Source |
|---|---|---|
| From Sept 2019 (GAO-22-104746 says as early as Jan 2019) | Attackers are inside SolarWinds' network; a test insertion of code into Orion follows (Microsoft dates test code to Oct 2019) | GAO (2021 blog, 2022 report), Microsoft |
| Mar - Jun 2020 | Trojanized Orion updates released: versions 2019.4 HF 5 through 2020.2.1 HF 1 | CISA |
| 2020 | SUNBURST sits dormant, then reaches out to attacker servers under `avsvmcloud.com`, with unique subdomains per victim | Microsoft, FireEye |
| Nov - Dec 2020 | FireEye finds the campaign while investigating an intrusion into its own systems and tells SolarWinds | GAO |
| 8 Dec 2020 | FireEye discloses that it was breached and that its red-team tools were stolen | FireEye announcement (title in Sources) |
| 13 Dec 2020 | CISA publishes an alert and Emergency Directive 21-01: federal civilian agencies must review for compromise and disconnect or power down affected Orion products. A fuller advisory, AA20-352A, follows on 17 Dec | CISA |
| Mid Dec 2020 | FireEye, Microsoft and GoDaddy turn the attackers' domain into a kill switch/sinkhole. It stops that backdoor from running in some cases but does not evict attackers who have other access | FireEye, press reports |
| 15 Apr 2021 | US government formally attributes the campaign to Russia's Foreign Intelligence Service (SVR), also tracked as APT29, Cozy Bear and, by Microsoft, NOBELIUM | White House statement |

---

## The attack path

1. **Build compromise (MITRE ATT&CK T1195.002, compromise software supply chain):** attackers modified code in the Orion build, so the normal build and signing process produced a poisoned DLL. CrowdStrike later documented a tool (SUNSPOT) that did this during the build.
2. **Delivery:** the signed update was distributed through the vendor's normal channel and installed by customers.
3. **Stealth:** SUNBURST waited, checked it was not on an analyst or test machine, and disguised its traffic as the Orion Improvement Program.
4. **Selection:** only chosen victims got follow-on tools. The rest never knew they had a dormant backdoor.
5. **Detection:** not by customers' security tools. A security vendor noticed because it was itself a victim.

---

## Controls that failed or were missing

*Added while preparing this page (not part of the original course submission); based on the public reports.*

| Control | Gap |
|---|---|
| Build-pipeline integrity | Attackers could change code inside the build; signing then certified it |
| Trust in signed vendor updates | The signature was treated as proof of safety |
| Third-party inventory | Many customers could not quickly say where Orion ran and which versions |
| Privilege on management servers | Orion typically held broad access; one compromised server became a launch point |
| Egress and behavioural monitoring | A monitoring server calling unusual domains over normal-looking HTTPS went unnoticed |
| Log retention | Investigators need long, trustworthy logs to look back months |
| Vendor-compromise response plan | Many organisations had no playbook for "our vendor was breached" |

---

## My leadership recommendations

From my briefing, in plain language:

1. **Keep a current inventory** of third-party software and management tools.
2. **Verify updates before deploying** and watch for unusual behaviour after installing them.
3. **Tighten access controls** for privileged accounts and cloud identity systems.
4. **Keep logs for much longer than usual and store trustworthy copies** so a vendor compromise can be investigated. (My briefing suggested printing and storing logs locally so they cannot be altered; the modern equivalent is write-once or off-host log storage.)
5. **Practise a vendor-compromise scenario** in the incident response plan.
6. **Patch known issues quickly**, including CVE-2020-10148, and track every exception with an owner and a deadline.

---

## What an IT support or SOC analyst would do differently

*Added while preparing this page (not part of the original course submission).*

- **Know where the management tools are.** Keep a living list of monitoring, patching and remote-access servers with their versions.
- **Stage updates.** Install vendor updates on a test group first and compare behaviour (new outbound domains, new services, new accounts) before wide rollout.
- **Baseline outbound traffic from management servers** and alert on new destinations. A monitoring server should talk to a very short list.
- **Limit what the tool can do.** Least privilege for service accounts; do not leave the tool's server with domain-wide rights.
- **When a vendor advisory lands, act on indicators fast:** search DNS and proxy logs for the published domain names, isolate the hosts, and write down what you found and what you could not check.

---

## Verification

*Added while preparing this page (not part of the original course submission).* Statements from my course material were compared with the public sources.

| Statement in my course material | Compared with | Result |
|---|---|---|
| Updates released March to June 2020 | CISA alert | Confirmed (versions 2019.4 HF 5 to 2020.2.1 HF 1) |
| Nearly 18,000 customers received the update | GAO | Confirmed (SolarWinds estimate) |
| Signed DLL carried the backdoor | Microsoft analysis | Confirmed |
| Backdoor waited 12 to 14 days | FireEye and Microsoft | Confirmed: a file-age check of 12 to 14 days plus random delays |
| C2 domain `avsvmcloud.com` redirected as kill switch | Press reports on FireEye, Microsoft, GoDaddy action | Confirmed; limits noted above |
| CVE-2020-10148 separate from SUNBURST | NVD, my briefing notes | Confirmed as a separate Orion API flaw |
| Attribution to SVR | White House statement, April 2021 | Confirmed as US government attribution |

---

## Interview talking points

1. **"What is a supply-chain attack?"** The attacker compromises something you already trust, such as a vendor's build process, so the malicious code arrives signed and through your normal update path. SolarWinds reached about 18,000 customers while the attackers chose only a few to exploit.
2. **"How would you reduce that risk with a small team?"** Inventory the management tools, stage updates, baseline their outbound traffic, restrict their privileges and keep logs long enough to look back. None needs a large budget.
3. **"Which two things did you keep separate?"** SUNBURST (planted code in a signed update) and CVE-2020-10148 (a different Orion flaw). Mixing them up would send a team to the wrong fix.

---

## Takeaways

1. A signature proves who signed, not that the code is safe.
2. Management tools are high-value targets and deserve the strictest monitoring.
3. Detection came from a vendor that was itself attacked. Plan for the case where nobody tells you.
4. Keep related-but-different vulnerabilities in separate boxes.

---

## Sources

- US Government Accountability Office, "SolarWinds Cyberattack Demands Significant Federal and Private-Sector Response" (WatchBlog, Apr 2021). https://www.gao.gov/blog/solarwinds-cyberattack-demands-significant-federal-and-private-sector-response-infographic
- US Government Accountability Office, GAO-22-104746 (Jan 2022), federal response to the SolarWinds and Microsoft Exchange incidents. https://www.gao.gov/products/gao-22-104746
- CISA, "Active Exploitation of SolarWinds Software" (13 Dec 2020, revised 14 Dec 2020). https://www.cisa.gov/news-events/alerts/2020/12/13/active-exploitation-solarwinds-software
- CISA, Emergency Directive 21-01. https://www.cisa.gov/emergency-directive-21-01
- CISA, Alert AA20-352A, "Advanced Persistent Threat Compromise of Government Agencies, Critical Infrastructure, and Private Sector Organizations" (17 Dec 2020, revised 15 Apr 2021). https://www.cisa.gov/news-events/cybersecurity-advisories/aa20-352a
- FireEye, "FireEye Shares Details of Recent Cyber Attack, Actions to Protect Community" (8 Dec 2020), originally on the FireEye blog (now Mandiant / Google Cloud).
- Microsoft Security, "Analyzing Solorigate, the compromised DLL file that started a sophisticated cyberattack" (18 Dec 2020). https://www.microsoft.com/en-us/security/blog/2020/12/18/analyzing-solorigate-the-compromised-dll-file-that-started-a-sophisticated-cyberattack-and-how-microsoft-defender-helps-protect/
- FireEye (now Mandiant), "Highly Evasive Attacker Leverages SolarWinds Supply Chain to Compromise Multiple Global Victims With SUNBURST Backdoor" (Dec 2020). https://cloud.google.com/blog/topics/threat-intelligence/evasive-attacker-leverages-solarwinds-supply-chain-compromises-with-sunburst-backdoor
- NIST National Vulnerability Database, CVE-2020-10148. https://nvd.nist.gov/vuln/detail/CVE-2020-10148

## Sanitisation note

Only public information is used. The original course slides are not republished; this is a rewritten summary. No personal data, course template text, or names of instructors or classmates appear here.
