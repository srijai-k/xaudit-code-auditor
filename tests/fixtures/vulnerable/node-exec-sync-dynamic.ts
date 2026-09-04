const { execSync } = require('child_process');
function run(branch) {
  execSync(`git checkout ${branch}`);
}
