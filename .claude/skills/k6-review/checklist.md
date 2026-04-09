# k6 Review Checklist

## 1. Test intent

- What exact performance question does this script answer?
- Is it baseline, load, stress, spike, soak, browser, resilience, or exploratory?
- Does the scenario design match that goal?

## 2. Scenario quality

- Are executors chosen appropriately?
- Are stages or arrival rates realistic?
- Are VUs and duration sensible?
- Are mixed scenarios separated cleanly?

## 3. Thresholds and checks

- Do thresholds reflect SLOs or meaningful expectations?
- Are checks used for correctness and thresholds used for pass/fail performance intent?
- Are thresholds attached to the right metrics/tags?

## 4. Metrics

- Are built-in metrics being interpreted correctly?
- Are custom metrics needed?
- Are tags sufficient to break down results by endpoint, scenario, or business flow?

## 5. Data realism

- Is test data realistic and parameterized?
- Are collisions, cache artifacts, or duplicates likely?
- Is setup creating or reusing data efficiently?

## 6. Script efficiency

- Are there unnecessary sleeps or expensive computations in hot paths?
- Is the load generator likely to become the bottleneck?
- Are large payloads, uploads, or browser steps justified?

## 7. HTTP correctness

- Are auth and headers handled correctly?
- Are response validations meaningful?
- Are redirects, correlation, and token refresh handled where needed?

## 8. Browser usage

- Is `k6/browser` used only when browser metrics matter?
- Would HTTP-level scripts answer the question more efficiently?
- Are browser steps isolated enough to diagnose issues?

## 9. Environment and safety

- Are env vars/config clean?
- Is production targeting explicit and safe?
- Are secrets handled safely?
- Is CI use appropriate for the test size?

## 10. Reporting and maintainability

- Are scripts organized clearly?
- Are outputs easy to compare between runs?
- Are thresholds, scenarios, and tags easy for the team to understand?
- Can a new engineer run and interpret the suite without tribal knowledge?
