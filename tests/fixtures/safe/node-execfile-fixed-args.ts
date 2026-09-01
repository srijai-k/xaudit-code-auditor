const { execFile } = require('child_process');
function status() {
  execFile("git", ["status"]);
}
