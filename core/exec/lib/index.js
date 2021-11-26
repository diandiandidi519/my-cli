"use strict";
const path = require("path");
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
      require(rootFile).call(null, [...arguments]);
    }
  } catch (error) {
    log.error(error);
  }
}

module.exports = exec;
