# Blameless post-mortem: uninstalling a test copy removed the real install's Windows entry

**Project:** a Windows setup and uninstall program for my suite of small desktop apps, built with AI coding assistants and reviewed by me.
**Found and fixed:** 2026-10-24 (fix in version 1.1.3); hardened further 2026-10-25.

## Summary

While testing, I uninstalled a test copy that had been installed with the `/noregister` option ("do not register this copy with Windows"). The uninstaller deleted the **real** install's Windows entry and its state key instead of the test copy's. It removed what it believed it owned without checking that the folder being uninstalled was the registered one.

## Impact

- The real install lost its Windows entry and its state key.
- My notes record no deleted application files and no user data loss.
- Not recorded: how the real install's entry was restored. The test copy's entry was rewritten by hand from its `install-record.json`.

## Timeline

- **2026-10-23/24:** I built the suite installer and kept one test copy, reinstalling over it each round.
- **2026-10-24:** the wrong-target deletion appeared while I was testing the uninstaller. The fix went into 1.1.3.
- **2026-10-25:** an independent audit reviewed the uninstall path again and more fixes followed. As of 2026-10-25, 1,283 automated tests pass.

## Root cause

The uninstall logic acted on the registered entry without asking: *is the folder I am removing the registered install?* A test copy and the real install look the same to that code. The fix is the missing ownership check, `Paths.IsRegisteredRoot(root)`, run before anything is deleted. (This reading comes from the fix; my notes do not keep the old code.)

## Contributing factors

- Two copies of the same product were installed side by side, a case the uninstaller was not designed or tested for.
- Cleanup acted on names and keys rather than on whether a path pointed into the folder being removed.
- I first exercised the destructive path on a machine that also held the real install.

## What changed

1. Uninstall checks `Paths.IsRegisteredRoot(root)` first and leaves the Windows entry and state key alone if the folder is not the registered root.
2. Startup entries are removed only if they point into the folder being uninstalled.
3. After the audit: uninstall touches only that folder's shortcuts, Run values and environment settings; `IsRegisteredRoot` falls back to the recorded install location; Repair Storage and Deep Uninstall deletions use the Recycle Bin with the standard warning; the shared cursor-art folder is protected from cleanup.

## Lessons

1. A destructive action must prove it owns its target. Scope by path, not by name.
2. Test uninstall with a second copy present.
3. Prefer reversible, warned deletion over silent removal.
4. An independent second look finds what the first fix missed.
5. Run installers that take `/switches` from PowerShell. Git Bash rewrites `/s`-style options as file paths.

## Action items

| Item | Status |
|---|---|
| Ownership check before uninstall | Done (1.1.3) |
| Scope shortcuts, Run values and environment to the folder | Done (2026-10-25 batch) |
| Recycle Bin with warnings in Repair Storage and Deep Uninstall | Done (2026-10-25 batch) |
| Add a named regression test for "uninstall a `/noregister` copy while the real install exists" | Open (not confirmed in my notes) |
| Uninstall still leaves one Explorer context-menu entry | Open |
| Record how the real install's entry was restored | Open |
