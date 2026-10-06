# Resident Bulk Import & Export Pipeline

## 1. Two-Stage Import Pipeline

To safely onboard hundreds or thousands of residents into a township or residential community without creating partial or corrupted database states, Community OS uses a 2-stage import workflow:

### Stage 1: Validation (`POST /api/v1/communities/:communityId/resident-import/validate`)

- Parses input CSV rows.
- Verifies unit existence and building codes within the designated community.
- Detects intra-batch duplicate emails and phone numbers.
- Returns validation report with row-by-row diagnostics without modifying the database.

### Stage 2: Atomic Commitment (`POST /api/v1/communities/:communityId/resident-import/commit`)

- Executes inside a database transaction (`prisma.$transaction`).
- Upserts residents, creates households, attaches household members, creates ownership or tenancy records, and activates occupancies.
- Updates `ResidentImportJob` status to `COMPLETED`.

---

## 2. CSV Formula Injection Defense

When exporting data to CSV via `GET /api/v1/communities/:communityId/residents/export`, fields starting with formula characters (`=`, `+`, `-`, `@`) are prepended with an apostrophe (`'`) to neutralize spreadsheet injection attacks.
