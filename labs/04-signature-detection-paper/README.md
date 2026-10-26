# Course analysis: Lab 04 — Signature Detection and Remote-Shell Prevention (paper summary)

**Environment:** Course-provided virtual lab: Snort IDS/IPS on Linux, packet capture
**Tools:** Snort rules, a packet capture to find the bytes, a test payload, the IPS log
**Skills:** reading packet bytes, writing and testing a signature rule, telling detection from prevention, validating a rule after writing it

**What this is, honestly:** a short APA-format paper (three pages or fewer) I wrote for the Chegg Skills cybersecurity course after a guided lab. The lab was a course exercise in a provided environment. This page is a one-page plain-English summary in my own words. The paper itself is not published here, because its screenshot shows course lab material; the exact lab strings are left out too.

---

## The problem

Block a known remote-shell attempt on a network and keep a record of it. The lab supplied a case-insensitive text string that appears in the attacker's traffic; my job was to find those bytes in a capture, write a rule that matches them, and prove the rule works.

## Method

1. **Find the bytes.** In the capture, locate the string in the payload and read its hexadecimal form, so the rule matches exactly what is on the wire.
2. **Write the rule.** A Snort rule has a *header* (the action, protocol, and which traffic to look at) and *options* (what to match). I used `content` for the string and `nocase` so changing upper and lower case would not slip past it.
3. **Choose prevention, not just detection.** I used a `drop` action so matching TCP traffic is blocked and logged, rather than an `alert`, which only reports. This works because the sensor sits inline as an IPS.
4. **Test it.** Send the lab's test payload, confirm the connection does not return a shell prompt, and look for the entry in the IPS log.

Illustrative shape of such a rule (placeholder values, not the lab answer):

```
drop tcp any any -> any any (msg:"remote shell signature"; content:"<lab string>"; nocase; sid:1000001; rev:1;)
```

## Result: unverified

This is a summary of my paper, not a verified lab result. The paper says I sent the test payload and checked two things: whether a shell prompt came back, and whether the rule's entry appeared in the IPS log. I do not recall seeing the Snort alert fire, so I am not claiming that the rule was confirmed to work. The paper also records a small lesson: a mistyped log path shows nothing, so a missing log file cannot tell you whether the rule worked. Check the path first, then the rule.

## What the paper concludes

- **IDS vs IPS:** an IDS reports suspicious traffic; an inline IPS can also stop it (NIST SP 800-94).
- **A signature rule is only as good as its validation.** After writing it, test it and review the log.

---

## Background, not from the paper: signature vs anomaly detection

I add this section for context. It is general knowledge from the NIST guide, not part of my lab paper.

| | Signature-based | Anomaly-based |
|---|---|---|
| Idea | Match known bad patterns (a string, byte sequence, hash) | Learn what normal looks like, flag departures |
| Strength | Fast, precise, easy to explain, few false alarms on known threats | Can catch new or unknown attacks |
| Limits | Misses anything new; attackers evade by changing the pattern, encoding it or splitting it across packets; encrypted traffic hides the pattern; rules need constant updating | Needs a good baseline; noisy; hard to explain why something fired |
| Example | A rule for one exact remote-shell string (this lab) | A server that suddenly sends gigabytes to a new country at 3 a.m. |

**Limits of my own rule:** `nocase` handles letter-case changes, nothing more. An attacker who changes the string, encodes it or uses a different channel would not match. That is why real defences layer signature rules with behaviour monitoring and logging.

---

## Takeaways

1. Detection tells you; prevention stops it. Know which one your tool is doing.
2. Look at the bytes on the wire, not just the text you expect.
3. Validate every rule, and validate the path to its evidence.
4. A signature is a narrow net. Pair it with other controls.

## Source

- National Institute of Standards and Technology, *Guide to Intrusion Detection and Prevention Systems (IDPS)*, SP 800-94 (2007). https://csrc.nist.gov/pubs/sp/800/94/final
- Cisco Talos, Snort 3 Rule Writing Guide: `content` and `nocase`. https://docs.snort.org/rules/options/payload/content and https://docs.snort.org/rules/options/payload/nocase

## Sanitisation note

Removed: the paper's screenshot (course lab page and VM name), the lab's exact signature string and test commands, addresses and hostnames, and the title-page template text.
