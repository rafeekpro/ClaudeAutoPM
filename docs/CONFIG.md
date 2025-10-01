# Configuration Guide

## Environment Variables
```bash
NODE_ENV=production
API_KEY=your-api-key
DATABASE_URL=postgresql://localhost/db
```

## Configuration File
Create a `config.json` file:

```json
{
  "port": 3000,
  "host": "localhost",
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp"
  }
}
```

## Advanced Settings
- Logging levels
- Performance tuning
- Security settings
- API rate limits

## Best Practices
1. Use environment variables for secrets
2. Keep configuration files out of version control
3. Use different configs for each environment
4. Document all configuration options