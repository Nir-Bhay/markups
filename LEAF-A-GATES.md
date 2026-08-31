# Leaf-A Gates: Security hardening for Markups

Scope: Security hardening changes for the `review/integration` branch (local-only,
NOT committed/pushed per user rule). Each gate has a runnable `CHECK` and an
`EXPECT` outcome. Run from repo root: `D:\harmes\projects\markups`.

- [x] G1: sanitize unit suite passes (B3 entity-decode hardening verified)
  CHECK: npx vitest run src/__tests__/sanitize.test.js --pool=threads
  EXPECT: Test Files 1 passed (1); Tests 8 passed (8)
  EVIDENCE: 2026-08-29 run — "Test Files 1 passed (1) / Tests 8 passed (8)".
    Suite includes "blocks entity-encoded javascript: URLs" which asserts
    shouldOpenPreviewLinkInNewTab('java&#x09;script:alert(1)') === false
    (src/utils/sanitize.js:62-65). B3 hardening holds; no 7/7 regression.

- [x] G2: ai-writer sendMessage() wraps fetch/network errors in catch -> {error}
  CHECK: grep -n "return { error: message }" src/features/ai-writer/service.js
  EXPECT: a catch block in sendMessage() (181-218) returns a user-friendly
    { error } object instead of letting the promise reject unhandled.
  EVIDENCE: src/features/ai-writer/service.js:215-226 — catch added; returns
    { error: message } for network/transport failures. Module loads OK
    (node --input-type=module import succeeded).

- [x] G3: Anthropic stream parser no longer re-throws non-JSON / error events
  CHECK: grep -n "continuing" src/features/ai-writer/service.js
  EXPECT: _parseAnthropicStream (416+) logs+warns and continues on malformed
    JSON and on 'error' SSE events, surfacing via onError; never aborts stream.
  EVIDENCE: src/features/ai-writer/service.js:460-469 — error event -> console.warn
    + onError(new Error(msg)) + continue; 472-477 — malformed JSON -> console.warn,
    no re-throw. Caller at :150 passes options.onError through.

## How to re-verify all gates

    cd D:\harmes\projects\markups
    # G1
    npx vitest run src/__tests__/sanitize.test.js --pool=threads
    # G2
    grep -n "return { error: message }" src/features/ai-writer/service.js
    # G3
    grep -n "continuing" src/features/ai-writer/service.js

## Notes

- The default vitest pool (forks) times out starting a worker in this environment;
  `--pool=threads` is the working invocation used above. The fork-pool timeout is
  an environment artifact, not a test failure.
- 7/7 expected per task; the committed suite actually contains 8 tests, all passing.
