'use strict';

const fs = require('fs');
const path = require('path');
const { startJavaServer } = require('./lib/javaServer');
const { startBedrockServer } = require('./lib/bedrockServer');

function loadConfig() {
  // When running as a single-executable (SEA) build, config.json is embedded
  // as an asset instead of living on disk next to this script.
  let sea;
  try {
    sea = require('node:sea');
  } catch (err) {
    sea = null;
  }

  if (sea && sea.isSea && sea.isSea()) {
    const externalConfigPath = path.join(path.dirname(process.execPath), 'config.json');
    if (fs.existsSync(externalConfigPath)) {
      return { config: JSON.parse(fs.readFileSync(externalConfigPath, 'utf8')), baseDir: path.dirname(process.execPath) };
    }
    return { config: JSON.parse(sea.getAsset('config.json', 'utf8')), baseDir: path.dirname(process.execPath) };
  }

  const baseDir = __dirname;
  const configPath = path.join(baseDir, 'config.json');
  return { config: JSON.parse(fs.readFileSync(configPath, 'utf8')), baseDir };
}

const { config, baseDir } = loadConfig();

function log(message) {
  console.log(`[demo-server] ${message}`);
}

startJavaServer(config, baseDir, log);
startBedrockServer(config, log);

log('Demo server is running. Point mcstats.de Server Status at this host to see it in action.');
