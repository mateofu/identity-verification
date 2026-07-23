# ADR 0001: Use a modular monolith

- Status: Accepted
- Date: 2026-07-22

## Decision

Use one React frontend and one modular FastAPI backend deployed through Docker Compose.

## Rationale

The challenge has one cohesive verification workflow and no independent scaling requirements. A modular monolith provides explicit boundaries without introducing distributed-system overhead.

## Consequences

- Development and deployment remain straightforward.
- Domain and infrastructure boundaries must be enforced through directory structure and tests.
- A model adapter can later be extracted into a separate service if measured performance or scaling needs justify it.

