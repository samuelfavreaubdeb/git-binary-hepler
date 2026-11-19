import { execSync } from 'child_process';

const limit = 21474836480; //20 GB in bytes
const staged = execSync('git diff --cached --name-only').toString().split('\n').filter(Boolean);
const error_msg = '';
let has_failed = false;

staged.forEach((file) => {
  const fileSize = execSync(`git cat-file -s :${file}`).toString().trim();
  if (Number(fileSize) > limit) {
    error_msg += `${error_msg} - ${file} : ${fileSize} bytes`;
    has_failed = true;
  }
});

if (has_failed) {
  console.error(
    `ERROR: These files exceed the limit of ${limit} bytes and should not be committed in their current form: ${error_msg}`,
  );
  process.exit(1);
}
