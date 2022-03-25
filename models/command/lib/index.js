'use strict';
const semver = require('semver');
const colors = require('colors/safe');
const log = require('@diandiandidi-cli/log');
const { isObject } = require('@diandiandidi-cli/utils');

const LOWEST_NODE_VERSION = 'v12.0.0';

class Command {
  constructor(argv) {
    if (!argv) {
      throw new Error('Command类的参数不能为空');
    }
    if (!Array.isArray(argv)) {
      throw new Error('Command类的参数必须为数组');
    }
    if (argv.length < 1) {
      throw new Error('Command类的参数不能为空');
    }
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      return Promise.resolve()
        .then(() => this.checkNodeVersion())
        .then(() => this.initArgs())
        .then(() => this.init())
        .then(() => this.exec())
        .catch((err) => {
          log.error(err);
        });
    });
  }
  initArgs() {
    this._cmd = this._argv.pop();
  }
  init() {
    throw new Error('init必须实现!');
  }
  exec() {
    throw new Error('exec必须实现');
  }
  // 检查node版本号
  checkNodeVersion() {
    // 获取当前node版本号
    const currentVersion = process.version;
    // 比对最低版本号
    const lowestVersion = LOWEST_NODE_VERSION;
    if (semver.gt(lowestVersion, currentVersion)) {
      throw new Error(
        colors.red(`需要安装 v${lowestVersion}已上的版本 Node.js`)
      );
    }
  }
}

module.exports = Command;
