# ADR 025: Enterprise Analytics, Semantic Metrics, Unified Search & Governed AI Architecture

## Status
Accepted

## Context
Community OS requires enterprise business intelligence, semantic metric governance, executive command centers, multi-community portfolio benchmarking, cross-domain drill-downs, unified enterprise search, and governed AI assistance across all 24 operational subdomains.

## Key Architectural Decisions & Principles
1. **Analytics Reads Business Truth**: Analytics consumes source domains (Finance, Billing, Helpdesk, Assets, Gate, Utilities, Safety) without duplicating or mutating transactional truth.
2. **KPI $\neq$ SQL Query**: Every KPI possesses a stable metric key, declared formula, grain, domain owner, and immutable version.
3. **Dashboard $\neq$ Source of Truth**: All displayed values trace back through Lineage $\rightarrow$ Dataset $\rightarrow$ Source Records.
4. **AI $\neq$ Authority**: AI summarizes, explains, and drafts query plans; AI NEVER autonomously mutates financial journals, approves workflows, admits visitors, or closes incidents.
5. **Mandatory Grounding**: Every factual AI response provides verifiable source citations, document versions, or metric references.
6. **Zero Client SQL**: Query DSL validates semantic ASTs without executing raw SQL from client or AI prompts.
7. **Prompt Injection Defense**: Clear separation between system policy, user query, and retrieved document context with strict sanitization.
