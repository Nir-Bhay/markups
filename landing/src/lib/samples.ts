export type DemoMode = "write" | "split" | "preview";

export interface DemoSample {
  id: string;
  label: string;
  tab: string;
  description: string;
  markdown: string;
}

export const demoSamples: DemoSample[] = [
  {
    id: "executive-brief",
    label: "Team brief",
    tab: "Executive team draft.md",
    description: "A compact decision brief with owners, a checklist, and a review flow.",
    markdown: `# Executive team draft

A one-page brief for the decision, owner, and next step.

## Workstreams

| Team | Lead | Next action |
| --- | --- | --- |
| Product | Asha | Sign off scope |
| Engineering | Dev | Review API |

## Review

- [x] Scope and owners agreed
- [ ] Customer note approved

\`\`\`mermaid
flowchart LR
  A[Align] --> B[Build] --> C[Review]
\`\`\`

$$confidence = \\frac{evidence}{assumptions}$$
`,
  },
  {
    id: "motion-notes",
    label: "Motion notes",
    tab: "Motion notes.md",
    description: "A study note combining a formula, a small table, and a code example.",
    markdown: `# Motion notes

A small study can keep its model and observations in one readable place.

## The model

$$T = 2\\pi\\sqrt{\\frac{L}{g}}$$

Here, $L$ is the pendulum length and $g$ is gravitational acceleration.

## Measurements

| Length | Result |
| --- | --- |
| 0.50 m | Shorter period |
| 1.00 m | Longer period |

\`\`\`ts
const period = 2 * Math.PI * Math.sqrt(length / gravity);
\`\`\`

> The estimate assumes a small starting angle.
`,
  },
];
