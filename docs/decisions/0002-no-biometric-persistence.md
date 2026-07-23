# ADR 0002: Do not persist biometric data

- Status: Accepted
- Date: 2026-07-22

## Decision

Process uploaded images and generated embeddings in memory and discard them after each request.

## Rationale

The challenge does not require verification history. Persistence would increase privacy, security and compliance risk without contributing to the required workflow.

## Consequences

- No database is required for the MVP.
- Application logs must exclude files, image payloads and embeddings.
- Verification history and auditing require a separate future design and explicit consent model.

