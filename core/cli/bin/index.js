#!/usr/bin/env node

const importLocal = require("import-local");

if (importLocal(__filename)) {
  require("npmlog").info("cli", "正在使用diandiandidi-cli脚手架");
} else {
  require("../lib")(process.argv.slice(2));
}
