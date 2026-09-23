'use strict';

const net = require('net');
const fs = require('fs');
const path = require('path');
const { writeVarInt, readVarInt } = require('./varint');

function writeString(str) {
  const strBuf = Buffer.from(str, 'utf8');
  return Buffer.concat([writeVarInt(strBuf.length), strBuf]);
}

function buildPacket(packetId, dataBuf) {
  const idBuf = writeVarInt(packetId);
  const body = Buffer.concat([idBuf, dataBuf]);
  return Buffer.concat([writeVarInt(body.length), body]);
}

function loadFavicon(config, baseDir) {
  if (!config.faviconPath) return null;
  const faviconFile = path.join(baseDir, config.faviconPath);
  if (!fs.existsSync(faviconFile)) return null;
  const data = fs.readFileSync(faviconFile);
  return `data:image/png;base64,${data.toString('base64')}`;
}

function buildStatusJson(config, favicon) {
  const samplePlayers = (config.samplePlayers || []).map((name) => ({
    name,
    id: '00000000-0000-0000-0000-000000000000',
  }));

  const status = {
    version: {
      name: config.versionName || '1.20.1',
      protocol: config.protocolVersion || 763,
    },
    players: {
      max: config.maxPlayers ?? 100,
      online: config.onlinePlayers ?? 0,
      sample: samplePlayers,
    },
    description: {
      text: config.motd || 'A Minecraft Server',
    },
  };

  if (config.subMotd) {
    status.description = {
      text: config.motd || 'A Minecraft Server',
      extra: [{ text: `\n${config.subMotd}` }],
    };
  }

  if (favicon) status.favicon = favicon;

  return JSON.stringify(status);
}

function startJavaServer(config, baseDir, log) {
  const favicon = loadFavicon(config, baseDir);

  const server = net.createServer((socket) => {
    let buffer = Buffer.alloc(0);
    let state = 0; // 0 = handshake, 1 = status, 2 = login

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      while (true) {
        const lengthInfo = readVarInt(buffer, 0);
        if (!lengthInfo) return; // not enough data yet
        const packetLength = lengthInfo.value;
        const totalLength = lengthInfo.length + packetLength;
        if (buffer.length < totalLength) return; // wait for more data

        const packetBuf = buffer.subarray(lengthInfo.length, totalLength);
        buffer = buffer.subarray(totalLength);

        const idInfo = readVarInt(packetBuf, 0);
        if (!idInfo) return;
        const packetId = idInfo.value;
        const dataOffset = idInfo.length;

        if (state === 0 && packetId === 0x00) {
          // Handshake packet: protocol version, server address, server port, next state
          let offset = dataOffset;
          const protoInfo = readVarInt(packetBuf, offset);
          offset += protoInfo.length;
          const addrLenInfo = readVarInt(packetBuf, offset);
          offset += addrLenInfo.length + addrLenInfo.value; // skip server address string
          offset += 2; // skip server port (unsigned short)
          const nextStateInfo = readVarInt(packetBuf, offset);
          state = nextStateInfo.value;
        } else if (state === 1 && packetId === 0x00) {
          // Status request -> respond with status response
          const json = buildStatusJson(config, favicon);
          const responseData = writeString(json);
          socket.write(buildPacket(0x00, responseData));
        } else if (state === 1 && packetId === 0x01) {
          // Ping -> pong with same payload (8-byte long)
          const payload = packetBuf.subarray(dataOffset, dataOffset + 8);
          socket.write(buildPacket(0x01, payload));
          socket.end();
        }
      }
    });

    socket.on('error', () => {
      socket.destroy();
    });
  });

  server.listen(config.javaPort, () => {
    log(`Java Edition status server listening on port ${config.javaPort}`);
  });

  return server;
}

module.exports = { startJavaServer };
