# ADR-0028: Governed AI Security Boundary & Prompt Injection Defense

## Status
Accepted

## Context
Phase 25 introduced natural-language assistant and document Q&A features. AI models must never bypass tenant isolation or execute untrusted instructions embedded in user documents.

## Decision
1. Authorization and tenant filtering happen BEFORE data retrieval.
2. The AI model receives only the minimal data subset permitted for the active actor.
3. User documents are treated as untrusted data wrapped in clear context delimiters.
4. Natural language analytics queries generate structured semantic query plans validated against metric registries—no arbitrary raw SQL is ever executed.

## Consequences
Prevents AI prompt injection and guarantees zero cross-tenant data leakage in AI responses.
