# Course analysis: Lab 05 — Incident Report Capstone (summary only)

**Environment:** Desk research; course capstone assignment
**Tools:** Public reports (GAO, House Oversight, NVD, DOJ), an incident-report template from the course
**Skills:** incident reporting, timeline reconstruction, indicators of compromise (IoCs), prioritising remediation, plain-language executive summary

**What this is, honestly:** the final capstone of my Chegg Skills cybersecurity certificate. The assignment was to write an incident report in a set format. The report covers a *public* incident, the 2017 Equifax breach (see [Lab 02](../02-equifax-2017-breach-lessons/)), so this was analysis of published facts, not a response to a live incident and not an investigation of any real organisation's systems. The report itself is not published here; this is a one-page summary. Research and editing help from AI tools was disclosed in the submission.

---

## What the report covers

Executive summary, detailed summary, parties involved, timeline, what was compromised, major findings, indicators of compromise, remediation recommendations (nine in the report; six in the matching briefing deck), conclusion.

Headline findings: a known Apache Struts flaw (CVE-2017-5638) left unpatched on an internet-facing portal; a monitoring certificate that had expired, so encrypted traffic was not inspected; no segmentation, so access spread to 48 unrelated databases; plain-text credentials; about 76 days of undetected access.

## How it maps to the NIST incident-response lifecycle

NIST SP 800-61 Rev. 2 describes four phases. (NIST published Revision 3 in April 2025, which re-frames response around the six CSF 2.0 functions; I use the classic four phases because they are the common vocabulary.) My report is a **post-incident analysis**, so it spends most of its length on two of the four. This mapping is mine, made for this summary; the report does not use the phase names.

| NIST 800-61 Rev. 2 phase | Where it shows up in my report |
|---|---|
| Preparation | Findings: what should have existed (asset inventory, patch verification, certificate tracking, segmentation, credential vault) |
| Detection and analysis | Timeline, what was compromised, and IoCs: malformed `Content-Type` headers, web shells in web folders, mass database queries, large encrypted outbound transfers |
| Containment, eradication and recovery | What Equifax did (portal taken offline, external forensics firm engaged) and my credential-reset and hardening recommendations |
| Post-incident activity | Recommendations, accountability and the lessons below |

## Verification and corrections

*Added while preparing this page (not part of the original course submission).* Statements in my report were compared with GAO-18-559 and the House Oversight report. Most held (48-hour patch policy, about 76 days, 48 databases, the scan that missed the portal). These did not match, and are corrected or dropped here:

| Statement in my report | Compared with | Correction |
|---|---|---|
| Attackers' first access 13-14 March | GAO and House Oversight | Sources say 10 March |
| Certificate expired 19 months | House Oversight (19) vs GAO (10) | Sources differ; cite both |
| "All databases unencrypted" | House Oversight | Some sensitive data was unencrypted |
| Total cost of about $2.4-2.5 billion | No primary source used here | Not verified; dropped |
| "$1 billion mandated" for IT security | No primary source used here | Not verified; dropped |
| YubiKeys for "the highest encryption" | General knowledge | Hardware security keys give strong multi-factor authentication; they do not encrypt data |

## Lessons

1. A control nobody verifies is a hope. Verify patching on the host, not in the ticket.
2. Check that your sensors are alive and unexpired. Silent monitoring is the worst failure.
3. Limit the blast radius: segmentation and credential hygiene decide how far an attacker goes.
4. Report the cause as a chain, not a person. Early public statements blamed one missed step; the evidence shows an unverified patch, an alert that did not reach the right people, a scan that missed the portal, a dead sensor and a flat network.
5. Group indicators by the type of evidence they leave (request headers, files on the web server, outbound traffic, database activity), so a defender knows where to look.
6. Separate what is known, what is inferred and what is alleged, and cite each. The attribution to China's PLA 54th Research Institute rests on a 2020 DOJ indictment, which is an allegation.

## Sources

- US GAO, GAO-18-559. https://www.gao.gov/products/gao-18-559
- US House Committee on Oversight and Government Reform, Equifax report (2018). https://oversight.house.gov/report/committee-releases-report-revealing-new-information-on-equifax-data-breach/
- NIST NVD, CVE-2017-5638. https://nvd.nist.gov/vuln/detail/CVE-2017-5638
- NIST SP 800-61 Rev. 2, Computer Security Incident Handling Guide (2012), and Rev. 3 (2025). https://csrc.nist.gov/pubs/sp/800/61/r3/final
- US DOJ, indictment of four members of China's military (2020). https://www.justice.gov/opa/press-release/file/1246891/dl

## Sanitisation note

The original report and the course template are not included. No names of instructors or classmates, no personal data.
