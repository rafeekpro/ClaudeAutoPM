# DateTime Rule

When any command requires date/time, you MUST obtain the REAL current date/time from the system.

## Command

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ"
```

## Required Format

ISO 8601 with UTC: `YYYY-MM-DDTHH:MM:SSZ`

Example: `2024-01-15T14:30:45Z`

## Rules

- **Never use placeholder dates** like `[Current ISO date/time]` or `YYYY-MM-DD`
- **Never estimate dates** - always get actual system time
- **Always use UTC** (the `Z` suffix)
- For new files: set both `created` and `updated` to current datetime
- For updates: update `updated` only, preserve `created`

## Cross-Platform Fallback

```bash
date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || \
python3 -c "from datetime import datetime; print(datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'))"
```
