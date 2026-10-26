<!-- DRAFT for Casey's review (branch phase2-drafts). Not pushed. Sections 5 and 6 are proposals, edit freely. -->
# Lab 02 — Equifax 2017: How a Missed Patch and an Expired Certificate Became a Breach of About 148 Million People

**Environment:** Desk research. No systems were touched and none were tested.
**Tools:** US GAO report GAO-18-559, US House Oversight Committee report (Dec 2018), NIST NVD entry for CVE-2017-5638, FTC and DOJ public documents
**Skills:** reading a primary-source breach report, building a timeline, separating cause from contributing factor, writing for leadership, patch and certificate lifecycle thinking

**What this is, honestly:** a course exercise from my Chegg Skills cybersecurity certificate. I wrote an incident report and a short leadership briefing deck on a *public* incident, using public sources. It is analysis, not a hands-on lab and not an investigation of Equifax's systems. Research and editing help from AI tools was disclosed in the course submission; the reading, analysis and writing are mine.

---

## The problem

In 2017 attackers stole personal data on roughly 148 million people from Equifax. The leadership question I set myself: *what single failure caused this, and what would stop the next one?* The answer was not a single failure.

---

## Assumption vs. reality

| Assumption | Reality |
|---|---|
| One person missed a patch email | The Oversight report describes a chain of process failures: an out-of-date alert distribution, no reliable inventory of what ran Struts, a scan that missed the portal, an expired monitoring certificate, flat network access. Early public statements blamed individual human error; the official reports do not stop there. |
| A patch order means the system is patched | The alert went out within days and required patching in 48 hours. The portal was still vulnerable months later. **Nobody verified completion.** |
| Monitoring was in place, so the attackers would have been seen | The traffic-inspection device could not inspect encrypted traffic because its certificate had expired. The attackers used encrypted channels. |
| The number of months is settled | It is not. The House report says the certificate had been expired about 19 months (expiry 31 Jan 2016 per its documents); GAO, working from Equifax's account, says about 10. Both agree it was expired before the data theft began in May 2017. |

---

## Method

1. Read the sources in order of authority: GAO and House Oversight first, then NVD for the vulnerability, then FTC and DOJ for outcomes and attribution.
2. Build a dated timeline and mark every date with its source. Where two sources disagree, keep both and say so.
3. For each failed control, write the control as an ordinary IT rule ("critical patches within 48 hours") and find the step where it silently stopped working.
4. Turn the findings into six recommendations a non-technical executive could approve, each with an owner and a check.

---

## What happened (timeline)

| When (2017) | Event | Source |
|---|---|---|
| Early March | Apache discloses and fixes the Struts flaw; US-CERT/DHS alerts Equifax the next day | House Oversight, GAO |
| 9 Mar | Equifax's threat-management team emails the alert to roughly 430 people and lists, with a 48-hour patch deadline | House Oversight |
| 10 Mar | First evidence of exploitation against the dispute portal: attackers confirm they can run commands. No data taken yet | GAO, House Oversight |
| About a week later | Equifax's scan for vulnerable Struts misses the portal | GAO, House Oversight |
| 13 May | Data theft begins; web shells give remote control | GAO, House Oversight |
| 13 May - 29 Jul | About 76 days of undetected access; roughly 9,000 queries across 48 databases beyond the portal's own | GAO |
| 29 Jul | Certificate renewed, inspection resumes, suspicious traffic seen | GAO |
| 30 Jul / 2 Aug | Portal taken offline; external forensics firm (Mandiant) engaged and FBI notified on 2 Aug | GAO, House Oversight |
| 7 Sep | Public disclosure | GAO |

Scale: GAO reports at least 145.5 million US consumers; Equifax raised its count to 147.9 million in March 2018. Records included names, SSNs, birth dates and addresses, about 209,000 card numbers and about 182,000 dispute documents. A 2019 settlement with the FTC, CFPB and states was worth at least $575 million. In 2020 the US DOJ indicted four members of China's PLA 54th Research Institute for the intrusion; an indictment is an allegation, not a conviction.

---

## The attack path

1. **Entry:** CVE-2017-5638, a flaw in the Apache Struts web framework (Jakarta Multipart parser) that lets an attacker run commands by sending a crafted `Content-Type` header. The internet-facing dispute portal (ACIS) was running a vulnerable version.
2. **Foothold and persistence:** attackers dropped web shells (small scripts that give remote control through the web server).
3. **Lateral movement:** a file with unencrypted usernames and passwords let them reach 48 databases unrelated to the portal.
4. **Collection and exfiltration:** thousands of queries, data staged and removed in small pieces over encrypted channels so it looked like ordinary traffic.
5. **Blindness:** the device that should have inspected that encrypted traffic had an expired certificate, so it saw nothing until 29 July.

---

## Controls that failed

| Control | What should have happened | What happened |
|---|---|---|
| Asset inventory | Know every system running Struts | No complete inventory; the portal was not identified as affected |
| Patch management | Critical patch in 48 hours, then verify | Alert went to an out-of-date recipient list; no completion check |
| Vulnerability scanning | Scan finds the flaw | Scan ran on the root directory, not the folder holding Struts (per the Oversight report) |
| Certificate lifecycle | Expiry tracked and alerted | Monitoring certificate expired for many months; the Oversight report counts hundreds of expired certificates company-wide |
| Segmentation | Portal cannot reach unrelated data | Three portal databases became 48 once credentials were found |
| Credential and data handling | Secrets in a vault; data encrypted | Plain-text credentials in a file; some sensitive data stored unencrypted |
| Query monitoring | Alert on mass queries | About 9,000 queries with no rate limit or alarm |

---

## My leadership recommendations

From my briefing, in plain language:

1. **Segment the network** so an internet-facing portal cannot reach unrelated databases.
2. **Keep an active inventory** of open-source libraries and legacy applications, and verify that critical patches were actually applied.
3. **Automate certificate-expiry warnings** and log review so monitoring blind spots are loud.
4. **Reset exposed credentials**, remove plain-text passwords, use a credential vault and strong multi-factor authentication.
5. **Audit regularly** and use red-team exercises to find weaknesses first.
6. **Make accountability enforceable:** documented owners, management sign-off and independent checks. Trust, but verify.

---

## What an IT support or SOC analyst would do differently (draft, my proposals)

- **Verify, do not assume.** After any critical-patch notice, check the version on the host, not the ticket status.
- **Watch the watchers.** Add a recurring check that every inspection device, log forwarder and certificate is alive and unexpired. A silent sensor is an incident of its own.
- **Triage by pattern, not volume** (the lesson from Lab 01): a few web-server requests carrying odd `Content-Type` headers, a new `.jsp` file in a web folder, or a service account running thousands of queries are each worth a ticket.
- **Escalate early with evidence:** timestamps, the host, the account, and what you did not check.
- **Treat expiry dates as maintenance tasks** with owners, like any other scheduled work.

---

## Verification

Claims in this writeup were checked against the primary reports, not copied from my slides.

| Claim in my course material | Checked against | Result |
|---|---|---|
| 48-hour patch policy | House Oversight report | Confirmed |
| Scan missed the portal (root directory) | House Oversight report | Confirmed (statement of Equifax's interim security chief) |
| 48 unrelated databases, about 76 days | GAO-18-559 | Confirmed |
| Certificate expired 19 months | House Oversight (19) vs GAO (10) | Sources differ; both stated above |
| "All databases unencrypted" | House Oversight | Overstated; corrected to "some sensitive data" |
| Total cost of about $2.4-2.5 billion | Not re-verified | Dropped from this writeup |

---

## Interview talking points

1. **"Walk me through a breach you studied."** Struts flaw disclosed in March, patch ordered, never verified on the portal, attackers in by 10 March, data out from 13 May, caught only on 29 July when a certificate was renewed. The root cause was missing verification and monitoring health checks, not one missed email.
2. **"What would you check first as a help-desk or SOC analyst?"** Whether the sensors are working: certificate dates, log flow, agent health. Then patch state on the host itself, not the ticket.
3. **"How do you handle conflicting information?"** I found GAO and the House report disagree on how long the certificate was expired (10 vs 19 months). I kept both, cited both, and noted that the conclusion holds either way.

---

## Takeaways

1. A control that is not verified is a hope, not a control.
2. Monitoring has to be monitored. The sensor that failed made every other control moot.
3. Reach is decided by segmentation and credential hygiene, not by the first exploit.
4. Cite the source and the disagreement; do not smooth it over.

---

## Sources

- US Government Accountability Office, *Data Protection: Actions Taken by Equifax and Federal Agencies in Response to the 2017 Breach*, GAO-18-559 (2018). https://www.gao.gov/products/gao-18-559
- US House Committee on Oversight and Government Reform, *The Equifax Data Breach* (Dec 2018). https://oversight.house.gov/report/committee-releases-report-revealing-new-information-on-equifax-data-breach/
- NIST National Vulnerability Database, CVE-2017-5638. https://nvd.nist.gov/vuln/detail/CVE-2017-5638
- Federal Trade Commission, Equifax settlement (July 2019). https://www.ftc.gov/news-events/news/press-releases/2019/07/equifax-pay-575-million-part-settlement-ftc-cfpb-states-related-2017-data-breach
- US Department of Justice, indictment of four members of China's military (Feb 2020). https://www.justice.gov/opa/press-release/file/1246891/dl

## Sanitisation note

Only public information is used. The original course slides and report are not republished; this is a rewritten summary. No personal data, course template text, or names of instructors or classmates appear here.
