# ADR 022: Enterprise Governance, Committee Management, AGM/EGM, Resolutions, Voting, Notices & Policies

## Status
Accepted

## Context
Residential and commercial housing societies require auditable, transparent, and structured governance for electing managing committees, scheduling annual general meetings (AGM) and extraordinary general meetings (EGM), evaluating live quorum, proposing and amending formal motions, conducting digital/paper voting, recording immutable resolutions, generating structured meeting minutes, broadcasting official estate notices with read receipts, and enforcing versioned community policies.

## Decision Invariants
1. **GOVERNANCE RECORD ≠ CHAT MESSAGE**: Official meeting decisions, motions, votes, and resolutions are permanent legal memory, not ephemeral chat streams.
2. **MEETING ≠ NOTICE**: A scheduled meeting is the operational container; an official Meeting Notice is a formal legal instrument with configurable minimum lead-time validation.
3. **AGENDA ≠ MINUTES**: An agenda outlines planned discussions prior to the meeting; minutes summarize authoritative outcomes, attendance, and adopted resolutions post-meeting.
4. **MOTION ≠ RESOLUTION**: A motion is a proposed proposal undergoing debate and amendments; a resolution is an adopted, binding decision.
5. **VOTE ≠ POLL**: Formal votes use single-use entitlements to create binding decisions/resolutions; community polls gather non-binding advisory resident feedback.
6. **COMMITTEE POSITION ≠ IAM ROLE**: Being elected President or Treasurer does NOT grant implicit permissions to post financial journals or release payments. IAM permissions remain explicit and decoupled.
7. **RESIDENT ELIGIBILITY ≠ LOGIN ACCOUNT**: Voting eligibility is based on property unit ownership/occupancy rules captured in frozen snapshots, independent of whether a resident has created a digital login.
8. **DOCUMENT ≠ GOVERNANCE RECORD**: Official PDF outputs (notices, minutes, signed policies) reference immutable Document Core versions.
9. **READ ≠ ACKNOWLEDGED**: Opening a notice logs a read receipt; explicit acceptance requires a separate, legally distinct acknowledgement action.
10. **PUBLISHED RECORDS MUST PRESERVE HISTORY**: Published agendas, published minutes, published notices, and effective policies are strictly immutable. Corrections create explicit version addenda or superseding revisions.

## Consequences
- Complete auditability and legal integrity across all committee operations and general body assemblies.
- Concurrency-safe, deterministic vote counting with zero risk of duplicate voting.
- Clean architectural decoupling from downstream finance, budgeting, and project execution domains.
