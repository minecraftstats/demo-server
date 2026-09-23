'use strict';

const fs = require('fs');
const path = require('path');
const { startJavaServer } = require('./lib/javaServer');
const { startBedrockServer } = require('./lib/bedrockServer');

const baseDir = __dirname;
const configPath = path.join(baseDir, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function log(message) {
  console.log(`[demo-server] ${message}`);
}

startJavaServer(config, baseDir, log);
startBedrockServer(config, log);

log('Demo server is running. Point mcstats.de Server Status at this host to see it in action.');
