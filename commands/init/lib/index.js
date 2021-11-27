"use strict";
const Command = require("@diandiandidi-cli/command");
const log = require("@diandiandidi-cli/log");
const { spinnerStart, sleep, execPromise } = require("@diandiandidi-cli/utils");
const Package = require("@diandiandidi-cli/package");
const { getProjectTemplate } = require("@diandiandidi-cli/request");
const fse = require("fs-extra");
const inquirer = require("inquirer");
const semver = require("semver");
const userHome = require("user-home");
const kebabCase = require("kebab-case");
const glob = require("glob");
const ejs = require("ejs");

const ignoreFile = [".git", "package.json", "node_modules"];
const TYPE_PROJECT = 0;
const TYPE_COMPONENT = 1;
const TEMPLATE_TYPE_NORMAL = "normal";
const TEMPLATE_TYPE_CUSTOM = "custom";

const CMD_WHITE_LIST = ["npm", "cnpm"];
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
        await this.installTemplate();
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
    this.templateInfo = templateInfo;
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

    this.templateNpm = pkg;

    if (await pkg.exists()) {
      const spinner = spinnerStart("正在更新模板");
      try {
        await sleep();
        await pkg.update();
        spinner.stop(true);
        log.success("更新成功");
      } catch (error) {
        spinner.stop(true);
        log.error(error);
      }
    } else {
      const spinner = spinnerStart("正在下载模板");
      try {
        await sleep();
        await pkg.install();
        spinner.stop(true);
        log.success("下载成功");
      } catch (error) {
        spinner.stop(true);
        log.error(error);
      }
    }
  }
  async installTemplate() {
    log.verbose("templateInfo", this.templateInfo);
    if (this.templateInfo) {
      if (!this.templateInfo.type) {
        this.templateInfo.type = TEMPLATE_TYPE_NORMAL;
      }
      if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
        // 标准安装
        await this.installNormalTemplate();
      } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
        // 自定义安装
        await this.installCustomTemplate();
      } else {
        throw new Error("项目模板信息无法识别");
      }
    } else {
      throw new Error("模板信息不存在");
    }
  }
  async installNormalTemplate() {
    const templatePath = path.resolve(
      this.templateNpm.cacheFilePath,
      "template"
    );
    const targetPath = process.cwd();
    fse.ensureDirSync(templatePath);
    fse.ensureDirSync(targetPath);
    let spinner = spinnerStart("正在安装模板");
    try {
      // 拷贝模板代码到当前目录
      fse.copySync(templatePath, targetPath);
      spinner.stop(true);
      log.success("模板安装成功");
    } catch (error) {
      spinner.stop(true);
      log.error(error);
    }
    const files = await this.ejsRender(process.cwd(), [
      "node_modules/**",
      "public/**",
    ]);
    const { installCommand, startCommand } = this.templateInfo;
    // 安装依赖
    await this.execCommand(installCommand, "安装依赖异常！");
    // 启动服务
    await this.execCommand(startCommand, "执行命令异常！");
  }

  async installCustomTemplate() {}

  async ejsRender(dir, ignore = "") {
    const projectInfo = this.projectInfo;
    return new Promise(function (resolve, reject) {
      glob(
        "**",
        {
          cwd: process.cwd(),
          ignore,
          nodir: true,
        },
        (err, files) => {
          if (err) {
            reject(err);
          }
          return Promise.all(
            files.map((file) => {
              const filePath = path.join(dir, file);
              return new Promise((resolve1, reject1) => {
                ejs.renderFile(filePath, projectInfo, (err1, result1) => {
                  if (err1) {
                    reject1(err1);
                  } else {
                    fse.writeFileSync(filePath, result1);
                    resolve1(result1);
                  }
                });
              });
            })
          )
            .then(resolve)
            .catch(reject);
        }
      );
    });
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
    const validProjectName = (name) => {
      return /^[a-zA-Z]+[\w-]*[a-zA-Z]$/.test(name);
    };
    let prompt = [
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
    ];

    if (!this.projectName.length || !validProjectName(this.projectName)) {
      prompt.splice(1, 0, {
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
            if (!validProjectName(v)) {
              done("请输入合法的项目名称");
              return;
            }
            done(null, true);
          }, 0);
        },
        filter(v) {
          return v;
        },
      });
    }
    // 选择项目或者组件
    const answers = await inquirer.prompt(prompt);
    answers.projectName = answers.projectName || this.projectName;

    // 获取项目的基本信息
    if (answers.projectName) {
      answers.className = kebabCase(answers.projectName).replace(/^-/, "");
      answers.version = answers.projectVersion;
    }

    return answers;
  }

  async execCommand(command, errMsg) {
    if (command) {
      const cmdSplit = command.split(" ");
      const cmd = cmdSplit[0];
      if (!CMD_WHITE_LIST.includes(cmd)) {
        throw new Error(`不识别的命令！${command}`);
      }
      const args = cmdSplit.slice(1);
      const installRet = await execPromise(cmd, args, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      if (installRet !== 0) {
        throw new Error(`${errMsg}${command}`);
      }
    }
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
