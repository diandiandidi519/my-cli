'use strict';

const axios = require('axios');
const urlJoin = require('url-join');
const semver = require('semver');

function getDefaultRegistry(isOriginal = false) {
  return isOriginal
    ? 'https://registry.npmjs.org'
    : 'https://registry.npm.taobao.org';
}

async function getNpmVersions(npmName) {
  const data = await getNpmInfo(npmName);
  if (data) {
    return Object.keys(data.versions);
  } else {
    return [];
  }
}
function getSemverVersions(baseVersion, versions) {
  return versions
    .filter((version) => semver.satisfies(version, `^${baseVersion}`))
    .sort((a, b) => semver.gt(a, b));
}

async function getNpmSemverVersions(npmName, baseVersion, registry) {
  const versions = await getNpmVersions(npmName, registry);
  const newVersions = getSemverVersions(baseVersion, versions);
  return newVersions?.[0];
}

function getNpmInfo(npmName, registry = getDefaultRegistry(false)) {
  if (!npmName) {
    return;
  }
  const npmUrl = urlJoin(registry, npmName);
  return axios
    .get(npmUrl)
    .then((res) => {
      if (res.status == 200) {
        return res.data;
      }
      return null;
    })
    .catch((err) => {
      return null;
    });
}

async function getLatestNpmVersion(npmName, registry) {
  const versions = await getNpmVersions(npmName, registry);
  if (versions) {
    versions.sort((a, b) => semver.gt(a, b));
    return versions[0];
  }
  return null;
}

module.exports = {
  getNpmInfo,
  getNpmVersions,
  getNpmSemverVersions,
  getDefaultRegistry,
  getLatestNpmVersion,
};
