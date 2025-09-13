## 🐳 DOCKER-FIRST DEVELOPMENT WORKFLOW

This project enforces Docker-first development to ensure consistency and reproducibility across all environments.

### 🚨 CRITICAL RULE: NO LOCAL EXECUTION

**All code must run inside Docker containers.** Local execution outside containers is blocked.

### 🔧 Docker Development Environment

#### Required Commands
- All development happens in Docker containers
- Use `docker compose` for orchestration
- Hot reload enabled for rapid development

#### Getting Started

1. **Start development environment**
   ```bash
   docker compose up -d
   ```

2. **Run commands in containers**
   ```bash
   # Commands depend on your project type:
   # Node.js: docker compose exec app npm install
   # Python: docker compose exec app pip install -r requirements.txt
   # Go: docker compose exec app go mod download
   # Ruby: docker compose exec app bundle install
   # PHP: docker compose exec app composer install

   # Development and testing commands will be project-specific
   ```

3. **View logs**
   ```bash
   docker compose logs -f app
   ```

### 📋 Docker-First Rules

- **NEVER** run `npm install` directly on host
- **NEVER** execute code outside containers
- **ALWAYS** use `docker compose exec` for commands
- **ALWAYS** define services in docker-compose.yml

### 🔥 Hot Reload Configuration

Development containers are configured with:
- Volume mounts for source code
- File watchers for automatic reload
- Debug ports exposed
- Database containers for local development

### ⚠️ Enforcement

If you attempt local execution, you'll see:
```
❌ Docker-first development enforced
Use: docker compose exec app <command>
```