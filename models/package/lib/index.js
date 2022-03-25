'use strict';
const path = require('path');
const pkgDir = require('pkg-dir');
const npmInstall = require('npminstall');
const fse = require('fs-extra');

const formatPath = require('@diandiandidi-cli/format-path');
const { isObject } = require('@diandiandidi-cli/utils');
const {
  getDefaultRegistry,
  getLatestNpmVersion,
} = require('@diandiandidi-cli/get-npm-info');
const { threadId } = require('worker_threads');

class Package {
  constructor(options) {
    // log.verbose("Package.options", options);
    if (!options) {
      throw new Error('Package类的options参数不能为空！');
    }
    if (!isObject(options)) {
      throw new Error('Package类的options参数必须为对象！');
    }
    //package的目标路径
    this.targetPath = options.targetPath;
    // 缓存package的的路径
    this.storeDir = options.storeDir;
    // package的name
    this.packageName = options.packageName;
    // package.version
    this.packageVersion = options.packageVersion;
    this.cacheFilePathPrefix = this.packageName.replace('/', '_');
  }
  async prepare() {
    if (this.storeDir && !fse.existsSync(this.storeDir)) {
      fse.mkdirpSync(this.storeDir);
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getLatestNpmVersion(this.packageName);
    }
  }

  // 是否存在
  async exists() {
    if (this.storeDir) {
      await this.prepare();
      return fse.existsSync(this.cacheFilePath);
    } else {
      return fse.existsSync(this.targetPath);
    }
  }
  // 安装package
  async install() {
    await this.prepare();
    return npmInstall({
      root: this.targetPath,
      storeDir: this.storeDir,
      registry: getDefaultRegistry(),
      pkgs: [
        {
          name: this.packageName,
          version: this.packageVersion,
        },
      ],
    });
  }
  // 更新package
  async update() {
    await this.prepare();
    // 获取最新的npm版本模块
    const latestPackageVersion = await getLatestNpmVersion(this.packageName);
    // 获取最新的版本号对应的路径是否存在
    const latestFilePath = this.getSpecificCacheFilePath(latestPackageVersion);
    // 如果不存存在，则直接安装最新版本
    if (!fse.existsSync(latestFilePath)) {
      await npmInstall({
        root: this.targetPath,
        storeDir: this.storeDir,
        registry: getDefaultRegistry(),
        pkgs: [
          {
            name: this.packageName,
            version: this.latestPackageVersion,
          },
        ],
      });
      this.packageVersion = latestPackageVersion;
    } else {
      this.packageVersion = latestPackageVersion;
    }
  }
  // 获取文件入口路径
  async getRootFilePath() {
    async function _getRootFilePath(targetPath) {
      // 获取package.json所在目录
      const dir = await pkgDir(targetPath);
      if (dir) {
        // 读取package.json  require
        const pkgFile = require(path.resolve(dir, './package.json'));
        // 寻找main.lib
        if ((pkgFile && pkgFile.main) || pkgFile.lib) {
          // 路径的兼容
          return formatPath(path.resolve(dir, pkgFile.main));
        }
        return null;
      }
    }
    if (this.storeDir) {
      return _getRootFilePath(this.cacheFilePath);
    } else {
      return _getRootFilePath(this.targetPath);
    }
  }
  getSpecificCacheFilePath(version) {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${version}@${this.packageName}`
    );
  }
  get cacheFilePath() {
    return path.resolve(
      this.storeDir,
      `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`
    );
  }
}

module.exports = Package;
