/**
 * Python Scaffold Manager
 * Centralized Python project scaffolding functionality
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Configuration
 */
const CONFIG = {
  defaults: {
    port: 8000,
    database: 'postgres',
    environment: 'development'
  }
};

/**
 * Template definitions
 */
const TEMPLATES = {
  fastapi: {
    main: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
`,
    requirements: `fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.4.2
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.4
pytest==7.4.3
pytest-asyncio==0.21.1
httpx==0.25.1
`
  },
  flask: {
    app: `from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def index():
    return jsonify({"message": "Welcome to Flask"})

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
`,
    requirements: `flask==3.0.0
flask-cors==4.0.0
flask-sqlalchemy==3.1.1
flask-migrate==4.0.5
flask-jwt-extended==4.5.3
python-dotenv==1.0.0
gunicorn==21.2.0
psycopg2-binary==2.9.9
redis==5.0.1
celery==5.3.4
pytest==7.4.3
pytest-flask==1.3.0
`
  }
};

class PythonScaffoldManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Creates API project
   */
  async createAPIProject(framework = 'fastapi', projectName = 'api') {
    if (framework === 'fastapi') {
      return await this.createFastAPIProject(projectName);
    } else if (framework === 'flask') {
      return await this.createFlaskProject();
    } else {
      throw new Error(`Unknown framework: ${framework}`);
    }
  }

  /**
   * Creates FastAPI project
   */
  async createFastAPIProject(projectName) {
    const projectDir = path.join(this.projectRoot, projectName);

    // Create directory structure
    await fs.mkdir(projectDir, { recursive: true });
    await fs.mkdir(path.join(projectDir, 'app'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'app', 'api'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'app', 'core'), { recursive: true });
    await fs.mkdir(path.join(projectDir, 'app', 'models'), { recursive: true });

    // Create main.py
    await fs.writeFile(path.join(projectDir, 'main.py'), TEMPLATES.fastapi.main);

    // Create __init__.py files
    await fs.writeFile(path.join(projectDir, 'app', '__init__.py'), '');
    await fs.writeFile(path.join(projectDir, 'app', 'api', '__init__.py'), '');
    await fs.writeFile(path.join(projectDir, 'app', 'core', '__init__.py'), '');
    await fs.writeFile(path.join(projectDir, 'app', 'models', '__init__.py'), '');

    // Create requirements.txt
    await fs.writeFile(
      path.join(this.projectRoot, 'requirements.txt'),
      TEMPLATES.fastapi.requirements
    );

    return {
      projectName,
      framework: 'fastapi',
      mainFile: `${projectName}/main.py`,
      structure: ['app/api', 'app/core', 'app/models']
    };
  }

  /**
   * Creates Flask project
   */
  async createFlaskProject() {
    // Create directory structure
    await fs.mkdir(path.join(this.projectRoot, 'templates'), { recursive: true });
    await fs.mkdir(path.join(this.projectRoot, 'static'), { recursive: true });
    await fs.mkdir(path.join(this.projectRoot, 'static', 'css'), { recursive: true });
    await fs.mkdir(path.join(this.projectRoot, 'static', 'js'), { recursive: true });

    // Create app.py
    await fs.writeFile(
      path.join(this.projectRoot, 'app.py'),
      TEMPLATES.flask.app
    );

    // Create requirements.txt
    await fs.writeFile(
      path.join(this.projectRoot, 'requirements.txt'),
      TEMPLATES.flask.requirements
    );

    return {
      framework: 'flask',
      mainFile: 'app.py',
      directories: ['templates/', 'static/']
    };
  }

  /**
   * Creates database models
   */
  async createModels(database = 'postgres') {
    await fs.mkdir(path.join(this.projectRoot, 'models'), { recursive: true });

    // Base model
    const baseModel = `from sqlalchemy import Column, Integer, DateTime, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
`;

    // User model
    const userModel = `from sqlalchemy import Column, String, Boolean
from .base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
`;

    // Database configuration
    const dbConfig = `from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "${database}://user:password@localhost/dbname"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`;

    await fs.writeFile(path.join(this.projectRoot, 'models', '__init__.py'), '');
    await fs.writeFile(path.join(this.projectRoot, 'models', 'base.py'), baseModel);
    await fs.writeFile(path.join(this.projectRoot, 'models', 'user.py'), userModel);
    await fs.writeFile(path.join(this.projectRoot, 'models', 'database.py'), dbConfig);

    return {
      database,
      models: ['base.py', 'user.py'],
      config: 'database.py'
    };
  }

  /**
   * Creates API routes
   */
  async createRoutes(resource = 'items') {
    await fs.mkdir(path.join(this.projectRoot, 'routes'), { recursive: true });

    const routeTemplate = `from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

router = APIRouter(prefix="/${resource}", tags=["${resource}"])

@router.get("/", response_model=List[dict])
def get_${resource}():
    """Get all ${resource}"""
    return [{"id": 1, "name": "Example"}]

@router.get("/{id}", response_model=dict)
def get_${resource.slice(0, -1)}(id: int):
    """Get a specific ${resource.slice(0, -1)}"""
    return {"id": id, "name": "Example"}

@router.post("/", response_model=dict)
def create_${resource.slice(0, -1)}(data: dict):
    """Create a new ${resource.slice(0, -1)}"""
    return {"id": 1, **data}

@router.put("/{id}", response_model=dict)
def update_${resource.slice(0, -1)}(id: int, data: dict):
    """Update a ${resource.slice(0, -1)}"""
    return {"id": id, **data}

@router.delete("/{id}")
def delete_${resource.slice(0, -1)}(id: int):
    """Delete a ${resource.slice(0, -1)}"""
    return {"message": "Deleted successfully"}
`;

    await fs.writeFile(path.join(this.projectRoot, 'routes', '__init__.py'), '');
    await fs.writeFile(
      path.join(this.projectRoot, 'routes', `${resource}.py`),
      routeTemplate
    );

    return {
      resource,
      file: `routes/${resource}.py`,
      endpoints: ['GET', 'POST', 'PUT', 'DELETE']
    };
  }

  /**
   * Adds authentication
   */
  async addAuthentication(authType = 'jwt') {
    await fs.mkdir(path.join(this.projectRoot, 'auth'), { recursive: true });

    const authInit = `from .auth import *
from .jwt import *
`;

    const jwtAuth = `from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
`;

    await fs.writeFile(path.join(this.projectRoot, 'auth', '__init__.py'), authInit);
    await fs.writeFile(path.join(this.projectRoot, 'auth', 'jwt.py'), jwtAuth);

    return {
      type: authType,
      module: 'auth/',
      functions: ['verify_password', 'create_access_token', 'decode_token']
    };
  }

  /**
   * Generates Docker configuration
   */
  async generateDockerConfig(port = CONFIG.defaults.port) {
    const dockerfile = `FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE ${port}

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${port}"]
`;

    const dockerCompose = `version: '3.8'

services:
  api:
    build: .
    ports:
      - "${port}:${port}"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/dbname
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - .:/app
    command: uvicorn main:app --reload --host 0.0.0.0 --port ${port}

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=dbname
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
`;

    await fs.writeFile(path.join(this.projectRoot, 'Dockerfile'), dockerfile);
    await fs.writeFile(path.join(this.projectRoot, 'docker-compose.yml'), dockerCompose);

    return {
      dockerfile: 'Dockerfile',
      compose: 'docker-compose.yml',
      port,
      services: ['api', 'db', 'redis']
    };
  }

  /**
   * Creates environment configuration
   */
  async createEnvironmentConfig(env = CONFIG.defaults.environment) {
    const envConfig = `# Environment
ENV=${env}
DEBUG=${env === 'development' ? 'true' : 'false'}

# Application
APP_NAME=Python API
APP_VERSION=1.0.0
SECRET_KEY=your-secret-key-here-change-in-production

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=30

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Logging
LOG_LEVEL=${env === 'development' ? 'DEBUG' : 'INFO'}
`;

    const configLoader = `import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(f".env.{os.getenv('ENV', 'development')}")

class Settings:
    # Environment
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Application
    APP_NAME: str = os.getenv("APP_NAME", "API")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "30"))

settings = Settings()
`;

    await fs.writeFile(path.join(this.projectRoot, `.env.${env}`), envConfig);
    await fs.writeFile(path.join(this.projectRoot, 'config.py'), configLoader);

    return {
      environment: env,
      configFile: `.env.${env}`,
      loader: 'config.py'
    };
  }

  /**
   * Sets up testing framework
   */
  async setupTesting(framework = 'pytest') {
    await fs.mkdir(path.join(this.projectRoot, 'tests'), { recursive: true });
    await fs.mkdir(path.join(this.projectRoot, 'tests', 'unit'), { recursive: true });
    await fs.mkdir(path.join(this.projectRoot, 'tests', 'integration'), { recursive: true });

    // Create pytest.ini
    const pytestConfig = `[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short --strict-markers --cov=app --cov-report=term-missing
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow tests
`;

    // Create conftest.py
    const conftest = `import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture
def client():
    from main import app
    return TestClient(app)

@pytest.fixture
def db_session():
    # Create test database session
    engine = create_engine("sqlite:///:memory:")
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    yield session
    session.close()
`;

    // Sample test
    const sampleTest = `import pytest

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

@pytest.mark.unit
def test_example_unit():
    assert 1 + 1 == 2

@pytest.mark.integration
def test_example_integration(db_session):
    # Test with database
    assert db_session is not None
`;

    await fs.writeFile(path.join(this.projectRoot, 'pytest.ini'), pytestConfig);
    await fs.writeFile(path.join(this.projectRoot, 'tests', '__init__.py'), '');
    await fs.writeFile(path.join(this.projectRoot, 'tests', 'conftest.py'), conftest);
    await fs.writeFile(path.join(this.projectRoot, 'tests', 'test_main.py'), sampleTest);

    return {
      framework,
      config: 'pytest.ini',
      testsDir: 'tests/',
      fixtures: 'conftest.py'
    };
  }
}

module.exports = PythonScaffoldManager;