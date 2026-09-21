# Ops V2 — Lesson Session as Source of Truth

Status: preview design only. Production database is untouched.

## Invariants
- Student is independent from Group.
- A student can belong to zero, one, or many groups.
- Groups can be created, archived, split, or recombined without rewriting history.
- Every lesson stores a student-name/group-name snapshot.
- 1-on-1 is a lesson with one student; it is not a separate database model.
- Lesson Session is the source of truth for Calendar, Finance, and Reporting.
- Scheduled lesson becomes earned/completed for reporting after end_at unless cancelled.
- Actual revenue/expense overrides expected revenue/expense when present.
- Historical finance_transactions stay intact during migration.

## Rollout
1. Safe UI preview on ops-v2 branch.
2. Review schema and interactions.
3. Apply additive schema migration only after approval.
4. Enable real Lesson Session writes.
5. Dual-read legacy finance + new sessions.
6. Manually assign legacy unassigned lessons.
7. Retire description-based inference only after reconciliation.
