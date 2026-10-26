# How I use AI safely

I use AI coding and research assistants every day. The rule underneath everything is simple: **an assistant's "done" is a claim, not evidence.** Here is how I turn claims into evidence.

**1. Verification over claims.** I ask for a check I can run, not for reassurance. When I trained a small local model for tool use, it scored 99.3 percent per token, which sounded excellent. Only 56 percent of whole replies were exactly right, and just 1 of 6 jobs worked in a real agent session. The number the model reported was not the number that mattered, so I switched to end-to-end agent tests.

**2. Independent auditors.** The assistant that builds something does not grade it. I run two separate reviewing agents, each doing its own research and plan, and I call work finished only when the builder and both auditors agree. They have caught real problems that the builder had signed off.

**3. Test counts, honestly read.** I report counts (my installer suite passes 1,283 tests as of 2026-10-25) because "it works" is not checkable. A count is a floor, not proof: an uninstall bug that deleted the wrong Windows entry got through until I hit it. So most fixes get a test that would have caught the bug.

**4. MD5-proof before deleting.** I am copying large project folders to cloud storage. Nothing local is deleted until the copy is checksum-verified, and the checksum has to match, not just "the upload finished".

**5. Know what a proof proves.** A checksum shows the copy matches the source archive. It does not show the archive is complete. An independent audit found that two of my backup archives were **empty**: Windows `tar` stopped at a broken folder link and wrote nothing useful, and an empty file copies perfectly. The fix was to build each archive from an exact list of real files and check the file count before the checksum.

**6. No secrets in prompts.** Passwords, API keys and cloud tokens stay in local config files that tools read themselves. They are never typed into a chat, printed to logs or uploaded. Identity documents are off-limits to any automated cleanup or sorting.

**7. A human approves destructive steps.** Deleting, publishing and pushing need my explicit yes. Drafts stay local until I have read them.

**8. I say when AI helped.** Course submissions carried an AI-use disclosure, and my public repositories state which parts were AI-assisted and then reviewed.

The short version: trust the evidence, check the checker, and keep the dangerous buttons in human hands.
