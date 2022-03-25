module.exports = core;

const path = require('path');
const { program } = require('commander');

const semver = require('semver');
const colors = require('colors/safe');
const userHome = require('user-home');
const fse = require('fs-extra');

const pkg = require('../package.json');
const log = require('@diandiandidi-cli/log');
const init = require('@diandiandidi-cli/init');
const exec = require('@diandiandidi-cli/exec');
const constant = require('./const');

let args, config;

// 获取版本信息
function checkPkgVersion() {
  log.info('diandiandidi-cli', pkg.version);
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
  const rootCheck = require('root-check');
  rootCheck();
}

// 检查用户主目录
function checkUserHome() {
  log.verbose('userHome', userHome);
  if (!userHome || !fse.existsSync(userHome)) {
    throw new Error(colors.red('当前登录用户主目录不存在！'));
  }
}

function checkEnv() {
  const dotenv = require('dotenv');
  const dotenvPath = path.resolve(userHome, '.env');
  if (fse.existsSync(dotenvPath)) {
    config = dotenv.config({ path: dotenvPath });
  }
  createDefaultConfig();
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig['cliHome'];
}

async function checkGlobalUpdate() {
  // 获取当前版本号和模块名
  const currentVersion = pkg.version;
  const npmName = pkg.name;

  // 调用npm api，获取所有版本名
  // 提取所有的版本号，比对大于当前版本的

  const { getNpmSemverVersions } = require('@diandiandidi-cli/get-npm-info');
  const lastVersion = await getNpmSemverVersions(npmName, currentVersion);
  // 获取最新的版本号，提示用户更新
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      '更新提示',
      colors.yellow(
        `请手动更新${npmName}，当前版本：${currentVersion}，最新版本：${lastVersion}`
      )
    );
  }
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .version(pkg.version)
    .usage('<command> [options]')
    .option('-d, --debug', '是否开启debug模式', false)
    .option('-tp, --targetPath <targetPath>', '项目目录', '');

  const options = program.opts();

  program
    .command('init [projectName]')
    .description('请输入项目名称')
    .option('-f --force', '是否强制初始化项目')
    .action(exec);

  program
    .command('publish')
    .option('--refreshServer', '是否强制更新远程的仓库')
    .action(exec);

  // 开启debug模式
  program.on('option:debug', function () {
    if (options.debug) {
      process.env.LOG_LEVEL = 'verbose';
    } else {
      process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
  });

  // 指定targetPath
  program.on('option:targetPath', function () {
    process.env.CLI_TARGET_PATH = options.targetPath;
  });

  /**该功能被废弃 */
  // program.on("command:*", function(obj) {
  //   console.log(obj);
  // });

  program.parse(process.argv);
  //解析输入的命令，没有指定的命令，输出帮助文档
  if (program.args && program.args.length < 1) {
    program.outputHelp();
  }
}

async function core() {
  try {
    await prepare();
    registerCommand();
  } catch (e) {
    log.error(e.message);
  }
}

async function prepare() {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    checkEnv();
    await checkGlobalUpdate();
  } catch (e) {
    log.error(e.message);
  }
}
