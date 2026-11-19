import { execSync } from 'child_process';

let data;
try {
  const gitLocksData = execSync('git lfs locks --verify --json', { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  data = JSON.parse(gitLocksData);
} catch {
  console.error('Failed to verify locks. Make sure you have Git LFS installed and configured.');
  process.exit(1);
}

const staged = execSync('git diff --cached --name-only').toString().split('\n').filter(Boolean);
const blocked = [];

data.theirs.forEach((e) => {
  if (staged.includes(e.path)) {
    blocked.push({ path: e.path, owner: e.owner.name });
  }
});

if (blocked.length) {
  console.error(`Locked by someone else: ${blocked.map((e) => `${e.path} (locked by ${e.owner})`).join(' --- ')}`);
  process.exit(1);
}
