#!/usr/bin/env node

import fs from 'fs';
import prompts from 'prompts';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templateDir = path.join(__dirname, 'template');

// Checking if the current directory is a Git repository
function isGitRepository() {
  try {
    fs.statSync('.git');
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
    throw err;
  }
}

if (!isGitRepository()) {
  console.log('❌ This is not a Git repository. Please run this script in the root of a Git repository.');
  process.exit(1);
}

// Prompting the user to select features to implement
const { templates } = await prompts({
  type: 'multiselect',
  name: 'templates',
  message: 'Select the features to implement :',
  hint: 'Space to select, Enter to confirm',
  instructions: false,
  choices: [
    { title: 'File size limit on commit', value: 'check-size', selected: true },
    { title: 'Check locked files', value: 'check-locks', selected: true },
  ],
});

if (!templates || templates.length === 0) {
  console.log('\n❌ Cancelled.');
  process.exit(1);
}

// Installing Husky in the users project
console.log('\n Installing dependencies...');
try {
  execSync('npm install --save-dev husky');
  execSync('npx husky init');
} catch (error) {
  console.error('❌ Error installing dependencies:', error);
  process.exit(1);
}

// Adding the selected features to the .husky directory
console.log('\n Adding the selected features to your project...');
let preCommitContent = '';

if (templates.includes('check-locks')) {
  const gitAttributesPath = '.gitattributes';
  try {
    if (!fs.existsSync(gitAttributesPath)) {
      console.log('\n Creating .gitattributes file...');
      fs.writeFileSync(gitAttributesPath, '');
    }
  } catch (error) {
    console.error('❌ Error creating .gitattributes file:', error);
    process.exit(1);
  }
}

templates.forEach((template) => {
  const sourcePath = path.join(templateDir, `${template}.js`);
  const destPath = `.husky/${template}.js`;

  try {
    fs.copyFileSync(sourcePath, destPath);
    preCommitContent += `node ${destPath}\n`;
  } catch (error) {
    console.error(`❌ Error copying ${sourcePath} to ${destPath}:`, error);
    process.exit(1);
  }
});

// Adding the pre-commit hook to the .husky/pre-commit file
try {
  const preCommitPath = '.husky/pre-commit';
  fs.writeFileSync(preCommitPath, preCommitContent, { mode: 0o755 });
} catch (error) {
  console.error('❌ Error writing pre-commit hook:', error);
  process.exit(1);
}

// Adds node_modules/ to .gitignore if not already present
try {
  const gitignorePath = '.gitignore';
  if (!fs.existsSync(gitignorePath)) {
    console.log('\n Adding .gitignore file...');
    fs.writeFileSync(gitignorePath, 'node_modules/');
  } else {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    if (!gitignoreContent.includes('node_modules/') && !gitignoreContent.includes('node_modules')) {
      console.log('\n Updating .gitignore file...');
      fs.appendFileSync(gitignorePath, '\nnode_modules/\n');
    } else {
      console.log('\n .gitignore file is already up to date.');
    }
  }
} catch (error) {
  console.error('❌ Error updating .gitignore:', error);
  process.exit(1);
}
