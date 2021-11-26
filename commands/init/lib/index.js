"use strict";
const Command = require("@diandiandidi-cli/command");
const log = require("@diandiandidi-cli/log");
class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || "";
    this.force = this._argv[1].force || false;
    log.verbose("projectName", this.projectName);
    log.verbose("force", this.force);
  }
  exec() {}
}

function init(argv) {
  return new InitCommand(argv);
}

module.exports = init;

module.exports.InitCommand = InitCommand;
