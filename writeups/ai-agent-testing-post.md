# Judge a tool-using local model by agent tests, not by token accuracy

**TL;DR:** my fine-tuned 4B model scored 99.3 percent per-token accuracy and still failed most real jobs. Per-token accuracy measures the wrong thing for an agent. End-to-end agent tests told me what was actually broken.

## The setup

I fine-tuned a small open model (Qwen3-4B-Instruct as the base, QLoRA on a 12 GB laptop GPU) to drive an asset-pipeline tool: it reads a request, calls tools in order and reports back. It runs locally in Ollama, inside the Hermes agent loop. All numbers below are from my setup in September 2026.

## The number that misled me

Training reported **99.3 percent token accuracy**. That is measured with *teacher forcing*: at every token the model is shown the correct previous tokens. A real agent never gets that help. One wrong character in a tool-call argument fails the whole call, and errors compound across turns.

| Measure | Result |
|---|---|
| Per-token accuracy (teacher forcing) | 99.3 % |
| Whole replies exactly right | 56 % |
| Jobs that completed in real Hermes sessions | 1 of 6 |

The small gap per token became a large gap per reply, and a larger one per job.

## What the agent tests found (that the metric could not)

- **Quantization was not the culprit.** Q8 instead of Q4_K_M scored 57 vs 54 out of 90 in my test set, effectively no change.
- **Argument order follows the tool schema.** When tools are listed directly, Ollama's constrained decoding writes arguments in the order of the schema, while the agent stores them with sorted keys. Keeping tool parameters alphabetical is my workaround.
- **Nested objects are unreliable.** In direct mode, object-typed arguments came out as `{}`; only text and numbers were safe. Small models also did not write nested recipe JSON reliably.
- **Move precision into the tool.** The fix was to let the tool accept plain words and use fixed tables, and leave the model to do procedure and reporting.
- **Context is a model parameter.** The compatibility (v1 chat-completions) endpoint ignored the context size I passed per request, so old turns were being cut away silently until I set it on the model itself. The agent also refuses models with under 64,000 tokens of context.
- **One model slot.** My Ollama ran with one loaded model and one parallel job, so two test jobs with different models blocked each other.

## Test-harness traps

- `subprocess.run(..., timeout=, shell=True)` on Windows kills only `cmd.exe`. The agent and its children kept running and kept the model busy. Use `Popen` and `taskkill /T /F`.
- Test runs that used a separate agent home still touched the one shared checkout, and left a launcher pointing at the wrong Python. Isolate test homes properly and disable lazy installs.

## What I would do again

1. Write the end-to-end test first: a request in, a verified result out.
2. Report the whole-job pass rate next to every other metric.
3. Change one variable at a time (quantization, schema order, context) and re-run the same tests.
4. Keep the model's job small and put precise work in deterministic tools.

## Takeaway

For a tool-using model, "does the job get done?" is the only metric that survives contact with reality. Token accuracy told me the model was nearly perfect; the agent tests told me what to fix.
