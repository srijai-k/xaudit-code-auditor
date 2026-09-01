const { spawn } = require('child_process');
function run(name) {
  spawn("echo " + name, [], { shell: true });
}
