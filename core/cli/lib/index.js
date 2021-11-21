module.exports = core;

const pkg = require("../package.json");
const log = require("@diandiandidi-cli/log");

function checkPkgVersion() {
  console.log(pkg.version);
}

function core() {
  console.log("exec core");
  checkPkgVersion();
  log.notice("cli", pkg.version);
}
