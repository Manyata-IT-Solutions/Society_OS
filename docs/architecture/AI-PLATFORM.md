# Governed Enterprise AI Platform

## Architecture
- **Provider Abstraction**: Decoupled interface supporting Mock, Gemini, and OpenAI.
- **Context Builder**: Scopes retrieval strictly to authorized tenant records with minimum necessary token payloads.
- **Audit & Feedback**: Comprehensive interaction logging tracking tokens, latency, sources, and user quality ratings.
