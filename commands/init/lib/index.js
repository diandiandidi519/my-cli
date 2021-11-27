"use strict";
const Command = require("@diandiandidi-cli/command");
const log = require("@diandiandidi-cli/log");
const { spinnerStart, sleep } = require("@diandiandidi-cli/utils");
const Package = require("@diandiandidi-cli/package");
const { getProjectTemplate } = require("@diandiandidi-cli/request");
const fse = require("fs-extra");
const inquirer = require("inquirer");
const semver = require("semver");
const userHome = require("user-home");

const ignoreFile = [".git", "package.json", "node_modules"];
const TYPE_PROJECT = 0;
const TYPE_COMPONENT = 1;
class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = this._argv[1].force || false;
    log.verbose("projectName", this.projectName);
    log.verbose("force", this.force);
  }
  async exec() {
    try {
      // 准备阶段
      const projectInfo = await this.prepare();
      log.verbose("projectInfo", projectInfo);
      this.projectInfo = projectInfo;
      if (projectInfo) {
        // 下载模板
        await this.downloadTemplate();
        // 安装模板
      }
    } catch (error) {
      log.error(error.message);
    }
  }
  async downloadTemplate() {
    // try {
    // 通过项目模板api获取项目模板信息
    // 通过egg.js搭建一套后端系统
    // 通过npm存储项目模板
    // 将项目模板信息存储到mongodb数据库中
    // 通过egg.js获取mongodb中的数据，并且通过API返回
    const templateInfo = this.template[this.projectInfo.projectTemplate];
    const { npmName, version } = templateInfo;
    const targetPath = path.resolve(userHome, ".diandiandidi", "template");
    const storeDir = path.resolve(
      userHome,
      ".diandiandidi",
      "template/node_modules"
    );
    const pkg = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version,
    });

    if (await pkg.exists()) {
      const spinner = spinnerStart("正在更新模板");
      try {
        await sleep();
        await pkg.update();
        spinner.stop(true);
        log.success("更新成功");
      } catch (error) {
        log.error(error);
      } finally {
        spinner.stop(true);
      }
    } else {
      const spinner = spinnerStart("正在下载模板");
      try {
        await sleep();
        await pkg.install();
        log.success("下载成功");
      } catch (error) {
        log.error(error);
      } finally {
        spinner.stop(true);
      }
    }
  }
  async prepare() {
    // 判断项目模板是否存在
    const template = await getProjectTemplate();
    if (!template || !template.length) {
      throw new Error("模板不存在");
    }
    this.template = template;
    const localPath = process.cwd();
    // 判断当前目录是否为空
    if (!this.isCwdEmpty(localPath)) {
      // force为false的时候
      // if (!this.force) {
      //   // 询问是否继续创建
      //   const { ifContinue } = await inquirer.prompt([
      //     {
      //       type: "confirm",
      //       name: "ifContinue",
      //       default: false,
      //       message: "当前文件夹不为空，是否继续创建项目",
      //     },
      //   ]);
      // }
      // 是否执行强制更新
      // if (ifContinue || this.force) {
      //   // 给用户做二次确认
      //   const { confirmDelete } = await inquirer.prompt([
      //     {
      //       type: "confirm",
      //       name: "confirmDelete",
      //       default: false,
      //       message: "是否确认清空当前目录的文件",
      //     },
      //   ]);
      //   // 清空当前目录
      //   console.log("清空");

      // }
      // 兼容--force如果传了--force只询问一次
      const _force = this.force;

      const { ifContinue, confirmDelete } = await inquirer.prompt([
        {
          type: "confirm",
          name: "ifContinue",
          default: false,
          message: "当前文件夹不为空，是否继续创建项目",
          when(answers) {
            return !_force;
          },
        },
        {
          type: "confirm",
          name: "confirmDelete",
          default: false,
          message: "是否确认清空当前目录的文件",
          when(answers) {
            return answers.ifContinue || _force;
          },
        },
      ]);
      if (confirmDelete) {
        fse.emptyDirSync(localPath);
      } else {
        return null;
      }
    }

    return this.getProjectInfo();
  }
  async getProjectInfo() {
    // 选择项目或者组件
    const answers = await inquirer.prompt([
      {
        type: "list",
        message: "请选择初始化类型",
        default: TYPE_PROJECT,
        name: "type",
        choices: [
          {
            name: "项目",
            value: TYPE_PROJECT,
          },
          {
            name: "组件",
            value: TYPE_COMPONENT,
          },
        ],
      },
      {
        type: "message",
        message: "请输入项目的名称",
        default: "",
        name: "projectName",
        when(answers) {
          return answers.type == TYPE_PROJECT;
        },
        validate(v) {
          const done = this.async();

          // 首字符为英文字符
          // 尾字符为英文或者数字
          // 字符仅允许_
          setTimeout(function () {
            if (!/^[a-zA-Z]+[\w-]*[a-zA-Z]$/.test(v)) {
              done("请输入合法的项目名称");
              return;
            }
            done(null, true);
          }, 0);
        },
        filter(v) {
          return v;
        },
      },
      {
        type: "input",
        message: "请输入项目的版本号",
        default: "1.0.0",
        name: "projectVersion",
        when(answers) {
          return answers.type == TYPE_PROJECT;
        },
        validate(v) {
          const done = this.async();
          setTimeout(function () {
            if (!semver.valid(v)) {
              done("请输入合法的版本号");
              return;
            }
            done(null, true);
          }, 0);
        },
        filter(v) {
          if (!!semver.valid(v)) {
            return semver.valid(v);
          } else {
            return v;
          }
        },
      },
      {
        type: "list",
        message: "请选择项目类型",
        default: 0,
        name: "projectTemplate",
        choices: this.createTemplateChoice(),
      },
    ]);
    // 获取项目的基本信息

    return answers;
  }

  createTemplateChoice() {
    return this.template.map((x, i) => ({
      name: x.name,
      value: i,
    }));
  }
  isCwdEmpty(localPath) {
    const fileList = fse.readdirSync(localPath);
    const leftFile = fileList.filter(
      (file) => !ignoreFile.some((item) => file.startsWith(item))
    );
    return !leftFile.length;
  }
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;

module.exports.InitCommand = InitCommand;
