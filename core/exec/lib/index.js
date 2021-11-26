"use strict";
const path = require("path");
const cp = require("child_process");

const Package = require("@diandiandidi-cli/package");
const log = require("@diandiandidi-cli/log");

const SETTINGS = {
  init: "axios" //@diandiandidi-cli/init
};
const CACHE_DIR = "dependencies";
async function exec() {
  try {
    let targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    log.verbose("homePath", homePath);
    log.verbose("targetPath", targetPath);
    let storeDir = "";
    let pkg;

    const cmdObj = arguments[arguments.length - 1];
    const cmdName = cmdObj._name;
    const packageName = SETTINGS[cmdName];
    const packageVersion = "latest";

    if (!targetPath) {
      //生成缓存路径
      targetPath = path.resolve(homePath, CACHE_DIR);
      storeDir = path.resolve(targetPath, "node_modules");
      log.verbose("targetPath", targetPath);
      log.verbose("storeDir", storeDir);
      pkg = new Package({
        targetPath,
        packageName,
        packageVersion,
        storeDir
      });
      if (await pkg.exists()) {
        // 存在，更新
        pkg.update();
      } else {
        // 不存在，安装
        await pkg.install();
      }
    } else {
      pkg = new Package({
        targetPath,
        packageName,
        packageVersion,
        storeDir
      });
    }

    const rootFile = await pkg.getRootFilePath();
    if (rootFile) {
      const args = [...arguments];
      const cmd = args.pop();
      const o = Object.create(null);
      Object.keys(cmd).forEach(key => {
        if (
          cmd.hasOwnProperty(key) &&
          !key.startsWith("_") &&
          key !== "parent"
        ) {
          o[key] = cmd[key];
        }
      });
      args.push(o);
      let code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
      const child = spawn("node", ["-e", code], {
        stdio: "inherit"
      });
      child.on("error", e => {
        log.error(e.message);
      });
      child.on("exit", e => {
        log.verbose("命令执行成功", e);
        process.exit(e);
      });
    }
  } catch (error) {
    log.error(error);
  }
}

function spawn(command, args, options = {}) {
  // 兼容windows平台
  const win32 = process.platform === "win32";
  const cmd = win32 ? "cmd" : command;
  const cmdArgs = win32 ? ["/c"].concat(command, args) : args;
  return cp.spawn(cmd, cmdArgs, options);
}

module.exports = exec;
