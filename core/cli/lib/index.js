module.exports = core;

const path = require("path");

const semver = require("semver");
const colors = require("colors/safe");
const userHome = require("user-home");
const fse = require("fs-extra");

const pkg = require("../package.json");
const log = require("@diandiandidi-cli/log");
const constant = require("./const");

let args, config;

// 获取版本信息
function checkPkgVersion() {
  log.notice("cli", pkg.version);
}

// 检查node版本号
function checkNodeVersion() {
  // 获取当前node版本号
  const currentVersion = process.version;
  // 比对最低版本号
  const lowestVersion = constant.LOWEST_NODE_VERSION;
  if (semver.gt(lowestVersion, currentVersion)) {
    throw new Error(colors.red(`需要安装 v${lowestVersion}已上的版本 Node.js`));
  }
}

// root降级
function checkRoot() {
  const rootCheck = require("root-check");
  rootCheck();
}

// 检查用户主目录
function checkUserHome() {
  console.log(userHome);
  if (!userHome || !fse.existsSync(userHome)) {
    throw new Error(colors.red("当前登录用户主目录不存在！"));
  }
}

// 解析入参参数
function checkInputArgs() {
  const parseArgs = require("minimist");
  args = parseArgs(process.argv.slice(2));
  checkArgs();
}

function checkArgs() {
  console.log(args);
  if (args.debug) {
    process.env.LOG_LEVEL = "verbose";
  } else {
    process.env.LOG_LEVEL = "info";
  }
  log.level = process.env.LOG_LEVEL;
}
function checkEnv() {
  const dotenv = require("dotenv");
  const dotenvPath = path.resolve(userHome, ".env");
  if (fse.existsSync(dotenvPath)) {
    config = dotenv.config({ path: dotenvPath });
  }
  createDefaultConfig();
  log.verbose("环境变量", process.env.CLI_HOME_PATH);
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig["cliHome"];
}

function core() {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    checkInputArgs();
    checkEnv();
  } catch (e) {
    log.error(e.message);
  }
}
