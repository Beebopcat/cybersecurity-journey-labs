<!-- DRAFT for Casey's review (branch phase2-drafts). Not pushed.
     IMPORTANT: the brief said the capstone used a fictional company ("Northwind Clinic"). The capstone files in source\ are a report on the REAL 2017 Equifax breach (the only "Offline Mock" capstone files are AI-made practice documents marked "not student work", and were not used). I did not invent a fictional scenario, because that would misdescribe the work. This summary describes the capstone as what it is: a course report on a public incident. If you do have a separate Northwind Clinic report, send it and this page should be rewritten. -->
# Lab 05 — Incident Report Capstone (summary only)

**Environment:** Desk research; course capstone assignment
**Tools:** Public reports (GAO, House Oversight, NVD, DOJ), an incident-report template from the course
**Skills:** incident reporting, timeline reconstruction, indicators of compromise (IoCs), prioritising remediation, plain-language executive summary

**What this is, honestly:** the final capstone of my Chegg Skills cybersecurity certificate. The assignment was to write an incident report in a set format. The report covers a *public* incident, the 2017 Equifax breach (see [Lab 02](../02-equifax-2017-breach-lessons/)), so this was analysis of published facts, not a response to a live incident and not an investigation of any real organisation's systems. The report itself is not published here; this is a one-page summary. Research and editing help from AI tools was disclosed in the submission.

---

## What the report covers

Executive summary, detailed summary, parties involved, timeline, what was compromised, major findings, indicators of compromise, remediation recommendations, conclusion.

Headline findings: a known Apache Struts flaw (CVE-2017-5638) left unpatched on an internet-facing portal; a monitoring certificate that had expired, so encrypted traffic was not inspected; no segmentation, so access spread to 48 unrelated databases; plain-text credentials; about 76 days of undetected access.

## How it maps to the NIST incident-response lifecycle

NIST SP 800-61 Rev. 2 describes four phases. (NIST published Revision 3 in April 2025, which re-frames response around the six CSF 2.0 functions; I use the classic four phases because they are the common vocabulary.) My report is a **post-incident analysis**, so it spends most of its length on two of the four. This mapping is mine, made for this summary; the report does not use the phase names.

| NIST 800-61 Rev. 2 phase | Where it shows up in my report |
|---|---|
| Preparation | Findings: what should have existed (asset inventory, patch verification, certificate tracking, segmentation, credential vault) |
| Detection and analysis | Timeline, what was compromised, and IoCs: malformed `Content-Type` headers, web shells in web folders, mass database queries, large encrypted outbound transfers |
| Containment, eradication and recovery | What Equifax did (portal taken offline, external forensics firm engaged) and my credential-reset and hardening recommendations |
| Post-incident activity | Recommendations, accountability and the lessons below |

## Key decisions I made

1. **Report the cause as a chain, not a person.** Early public statements blamed one missed step. The evidence shows a patch not verified, an alert that did not reach the right people, a scan that missed the portal, a dead sensor and a flat network. The report says so.
2. **Organise IoCs by attack stage** (exploit, persistence, discovery, exfiltration) so a defender knows what to look for at each step.
3. **Prioritise six remediation steps for an executive reader**, each with an owner and a check: segmentation, inventory and patch verification, certificate and log automation, credential vaulting and multi-factor, regular audits, and enforceable sign-off.
4. **Separate facts from allegations.** The attribution to China's PLA 54th Research Institute rests on a 2020 DOJ indictment, which is an allegation.

## Verification and corrections

I re-checked my own report against GAO-18-559 and the House Oversight report. Most claims held (48-hour patch policy, 76 days, 48 databases, root-directory scan miss). Two statements were stronger than the sources:

- "All databases unencrypted" should read "some sensitive data was unencrypted."
- A total cost figure of roughly $2.4 to 2.5 billion is not drawn from the primary reports. I would cite the 2019 settlement (at least $575 million) instead.

The expired-certificate duration also differs by source (about 19 months per the House report, about 10 per GAO).

## Lessons

1. A control nobody verifies is a hope. Verify patching on the host, not in the ticket.
2. Check that your sensors are alive and unexpired. Silent monitoring is the worst failure.
3. Limit the blast radius: segmentation and credential hygiene decide how far an attacker goes.
4. A good incident report separates what is known, what is inferred and what is alleged, and cites each.

## Sources

- US GAO, GAO-18-559. https://www.gao.gov/products/gao-18-559
- US House Committee on Oversight and Government Reform, Equifax report (2018). https://oversight.house.gov/report/committee-releases-report-revealing-new-information-on-equifax-data-breach/
- NIST NVD, CVE-2017-5638. https://nvd.nist.gov/vuln/detail/CVE-2017-5638
- NIST SP 800-61 Rev. 2, Computer Security Incident Handling Guide (2012), and Rev. 3 (2025). https://csrc.nist.gov/pubs/sp/800/61/r3/final
- US DOJ, indictment of four members of China's military (2020). https://www.justice.gov/opa/press-release/file/1246891/dl

## Sanitisation note

The original report and the course template are not included. No names of instructors or classmates, no personal data.
