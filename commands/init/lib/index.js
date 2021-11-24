"use strict";

function init(name, options, command) {
  console.log("init", name, options);
  console.log(command.parent._optionValues);
}

module.exports = init;
