module.exports = core;

const semver = require("semver");
const colors = require("colors/safe");

const pkg = require("../package.json");
const log = require("@diandiandidi-cli/log");
const constant = require("./const");

function checkPkgVersion() {
  log.notice("cli", pkg.version);
}

function checkNodeVersion() {
  // 获取当前node版本号
  const currentVersion = process.version;
  // 比对最低版本号
  const lowestVersion = constant.LOWEST_NODE_VERSION;
  if (semver.gt(lowestVersion, currentVersion)) {
    throw new Error(colors.red(`需要安装 v${lowestVersion}已上的版本 Node.js`));
  }
}

function checkRoot() {
  const rootCheck = require("root-check");
  rootCheck();
}

function core() {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
  } catch (e) {
    log.error(e.message);
  }
}
