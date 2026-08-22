# Plans

This directory holds plans produced by Systematic workflows.

- `archive/` contains pre-Systematic plans migrated from `.ai/plan/`.
- `status` records the plan disposition, such as `shipped` or `obsolete`.
- `completion` records the original checked-task ratio (`checked/total`).
- `acceptance_gates` records whether a plan’s acceptance gates were formally verified.

The checkbox ratios come from the original plans. A plan is marked `shipped` only after verifying that its described code exists in `packages/`; the plans’ own claims were not used as the sole basis for classification.
