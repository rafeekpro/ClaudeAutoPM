# Rule: Database Management Strategy

This document outlines the required strategy for managing databases across all project environments.

| Environment         | Tool / Service                  | Lifecycle / Purpose                 | Data Source                               | Persistence               |
| ------------------- | ------------------------------- | ----------------------------------- | ----------------------------------------- | ------------------------- |
| **Local (Dev)** | `docker-compose`                | Long-running, per-developer         | Migrations + Developer Seeds              | **Yes** (Named Volume)    |
| **CI/CD (Tests)** | `kubectl run`                   | **Ephemeral**, per-PR/commit        | Migrations + Test Seeds                   | **No** (Clean for every run) |
| **Staging** | Managed Cloud DB (e.g., RDS)    | Long-running, shared by team        | Sanitized/Anonymized Production Dump      | **Yes** (Persistent)      |
| **Production** | Managed Cloud DB (High-Availability) | Long-running, critical user data    | Live User Data                            | **Yes** (HA + Backups)    |

### Key Principles

1. **Local:** Use a named Docker volume to persist data between `docker compose up/down` cycles.
2. **CI/CD:** The database MUST be created from scratch for every test run to ensure perfect isolation and repeatability. DO NOT use persistent volumes in CI.
3. **Staging:** The database schema should be an exact mirror of production. Data should be a recent, anonymized copy of production data.
4. **Migrations:** All schema changes in every environment MUST be handled by a migration tool (e.g., Alembic, Flyway). No manual `ALTER TABLE` commands.
