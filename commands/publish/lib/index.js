'use strict';
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra')
const Command = require("@diandiandidi-cli/command");
const log = require("@diandiandidi-cli/log");

class PublishCommand extends Command {
    initArgs() {
        this._cmd = this._argv.pop();
    }
    init() {
        console.log('init', this._argv);
    }
    exec() {
        try {
            const startTime = new Date().getTime();
            // 1.初始化检查
            this.prepare()
            const endTime = new Date().getTime();
            log.info('本次发布耗时', Math.floor(endTime - startTime) / 1000 + '秒');
        } catch (err) {
            log.error(err.message);
        }
    }
    checkNodeVersion() {

    }
    prepare() {
        //1. 确认项目是否为npm项目
        const projectPath = process.cwd();
        const pkgPath = path.resolve(projectPath, 'package.json');
        log.verbose('package.json', pkgPath);
        if (!fs.existsSync(pkgPath)) {
            throw new Error('package.json不存在')
        }
        //2. 确认项目是否包含build命令
        const pkg = fse.readJsonSync(pkgPath)

        const { name, version, scripts } = pkg;

        if (!name || !version || !scripts?.build) {
            throw new Error('package.json信息不全，请检查存在name、version和scripts（build命令）');
        }
        this.projectInfo = { name, version, dir: projectPath }
    }

}
function publish(argv) {
    return new PublishCommand(argv);
}

module.exports = publish;

module.exports.PublishCommand = PublishCommand;
