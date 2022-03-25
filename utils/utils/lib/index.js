'use strict';
const fse = require('fs-extra');

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}
function spinnerStart(msg, spinnerString = '|/-\\') {
  const Spinner = require('cli-spinner').Spinner;
  const spinner = new Spinner(`${msg}..%s`);
  spinner.setSpinnerString(spinnerString);
  spinner.start();
  return spinner;
}

function sleep(timeout = 1000) {
  return new Promise((resolve, reject) => setTimeout(resolve, timeout));
}

function exec(command, args, options = {}) {
  const cp = require('child_process');
  // 兼容windows平台
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
  return cp.spawn(cmd, cmdArgs, options);
}

function execPromise(command, args, options = {}) {
  return new Promise(function (resolve, reject) {
    const child = exec(command, args, options);
    child.on('error', (e) => {
      resolve(e);
    });
    child.on('exit', (e) => {
      resolve(e);
    });
  });
}

function readFile(path, options = {}) {
  if (fse.existsSync(path)) {
    const buffer = fs.readFileSync(path);
    if (buffer) {
      if (options.toJson) {
        return buffer.toJson();
      } else {
        return buffer.toString();
      }
    }
  }
  console.log(path);
}

function writeFile(path, data, { rewrite = true } = {}) {
  if (fs.existsSync(path)) {
    if (rewrite) {
      fs.writeFileSync(path, data);
    }
    return false;
  } else {
    fs.writeFileSync(path, data);
    return true;
  }
}

module.exports = {
  isObject,
  spinnerStart,
  sleep,
  exec,
  execPromise,
  readFile,
  writeFile,
};
