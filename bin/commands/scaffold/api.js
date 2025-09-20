/**
 * Scaffold API Command
 * Deterministic project structure generation
 */

const fs = require('fs-extra');
const path = require('path');
const { printSuccess, printError, printInfo, createSpinner } = require('../../../lib/commandHelpers');

// Deterministic project structures
const PROJECT_STRUCTURES = {
  'express-rest': {
    folders: [
      'src/controllers',
      'src/models',
      'src/routes',
      'src/middleware',
      'src/utils',
      'tests/unit',
      'tests/integration',
      'config'
    ],
    files: {
      'src/index.js': `const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api', require('./routes'));

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
      'src/routes/index.js': `const router = require('express').Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;`,
      'package.json': `{
  "name": "express-api",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.0.0"
  }
}`
    }
  },
  'fastapi': {
    folders: [
      'app/api/endpoints',
      'app/core',
      'app/models',
      'app/schemas',
      'app/services',
      'tests'
    ],
    files: {
      'app/main.py': `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}`,
      'requirements.txt': `fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
python-dotenv==1.0.0`,
      'Makefile': `run:
\tuvicorn app.main:app --reload

test:
\tpytest tests/

install:
\tpip install -r requirements.txt`
    }
  }
};

exports.command = 'scaffold:api <type>';
exports.describe = 'Create deterministic API project structure';

exports.builder = (yargs) => {
  return yargs
    .positional('type', {
      describe: 'API type to scaffold',
      type: 'string',
      choices: Object.keys(PROJECT_STRUCTURES)
    })
    .option('docker', {
      describe: 'Also create Docker files',
      type: 'boolean',
      default: false
    });
};

exports.handler = async (argv) => {
  const spinner = createSpinner(`Scaffolding ${argv.type} API...`);

  try {
    spinner.start();

    const structure = PROJECT_STRUCTURES[argv.type];

    // Create folders
    for (const folder of structure.folders) {
      await fs.ensureDir(folder);
      printSuccess(`Created: ${folder}/`);
    }

    // Create files
    for (const [filepath, content] of Object.entries(structure.files)) {
      await fs.writeFile(filepath, content);
      printSuccess(`Created: ${filepath}`);
    }

    // Create Docker files if requested
    if (argv.docker) {
      const dockerTemplate = argv.type.includes('express') ? 'node-20-alpine' : 'python-3.11';
      const { handler } = require('./docker/create');
      await handler({
        template: dockerTemplate,
        compose: argv.type.includes('express') ? 'node-basic' : null
      });
    }

    spinner.succeed(`${argv.type} API structure created successfully!`);

    // Show next steps
    printInfo('\nNext steps:');
    if (argv.type.includes('express')) {
      printInfo('1. Install dependencies: npm install');
      printInfo('2. Run development server: npm run dev');
    } else {
      printInfo('1. Create virtual environment: python -m venv venv');
      printInfo('2. Install dependencies: pip install -r requirements.txt');
      printInfo('3. Run server: make run');
    }

  } catch (error) {
    spinner.fail();
    printError(`Failed to scaffold API: ${error.message}`);
    process.exit(1);
  }
};