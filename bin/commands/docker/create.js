/**
 * Docker Create Command
 * Deterministic Dockerfile generation
 */

const fs = require('fs-extra');
const path = require('path');
const { printSuccess, printError, printInfo, createSpinner } = require('../../../lib/commandHelpers');

// Deterministic templates
const DOCKERFILE_TEMPLATES = {
  'node-20-alpine': `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`,

  'node-20-dev': `FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]`,

  'python-3.11': `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]`,

  'python-fastapi': `FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`
};

const DOCKERIGNORE_TEMPLATE = `node_modules
npm-debug.log
.git
.env
.DS_Store
*.log
dist
build
.vscode
.idea`;

const DOCKER_COMPOSE_TEMPLATES = {
  'node-basic': `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development`,

  'node-mongo': `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - MONGO_URI=mongodb://mongo:27017/myapp
    depends_on:
      - mongo

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:`
};

exports.command = 'docker:create [template]';
exports.describe = 'Create Dockerfile with deterministic templates';

exports.builder = (yargs) => {
  return yargs
    .positional('template', {
      describe: 'Template to use',
      type: 'string',
      choices: Object.keys(DOCKERFILE_TEMPLATES),
      default: 'node-20-alpine'
    })
    .option('compose', {
      describe: 'Also create docker-compose.yml',
      type: 'string',
      choices: Object.keys(DOCKER_COMPOSE_TEMPLATES)
    })
    .option('force', {
      describe: 'Overwrite existing files',
      type: 'boolean',
      default: false
    });
};

exports.handler = async (argv) => {
  const spinner = createSpinner('Creating Docker files...');

  try {
    spinner.start();

    // Check if Dockerfile exists
    if (await fs.pathExists('Dockerfile') && !argv.force) {
      spinner.fail();
      printError('Dockerfile already exists. Use --force to overwrite');
      process.exit(1);
    }

    // Create Dockerfile
    const dockerfileContent = DOCKERFILE_TEMPLATES[argv.template];
    await fs.writeFile('Dockerfile', dockerfileContent);
    printSuccess(`Created Dockerfile with template: ${argv.template}`);

    // Create .dockerignore
    if (!await fs.pathExists('.dockerignore')) {
      await fs.writeFile('.dockerignore', DOCKERIGNORE_TEMPLATE);
      printSuccess('Created .dockerignore');
    }

    // Create docker-compose.yml if requested
    if (argv.compose) {
      const composeContent = DOCKER_COMPOSE_TEMPLATES[argv.compose];
      await fs.writeFile('docker-compose.yml', composeContent);
      printSuccess(`Created docker-compose.yml with template: ${argv.compose}`);
    }

    spinner.succeed('Docker files created successfully!');

    // Show next steps
    printInfo('\nNext steps:');
    printInfo('1. Build image: docker build -t myapp .');
    printInfo('2. Run container: docker run -p 3000:3000 myapp');
    if (argv.compose) {
      printInfo('3. Or use compose: docker compose up');
    }

  } catch (error) {
    spinner.fail();
    printError(`Failed to create Docker files: ${error.message}`);
    process.exit(1);
  }
};