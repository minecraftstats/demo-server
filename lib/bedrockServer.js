'use strict';

const dgram = require('dgram');
const crypto = require('crypto');

const UNCONNECTED_PING = 0x01;
const UNCONNECTED_PONG = 0x1c;
const RAKNET_MAGIC = Buffer.from([
  0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe,
  0xfd, 0xfd, 0xfd, 0xfd, 0x12, 0x34, 0x56, 0x78,
]);

function buildMotdString(config) {
  const fields = [
    'MCPE',
    config.motd || 'A Minecraft Server',
    String(config.bedrockProtocolVersion ?? 622),
    config.bedrockVersionName || '1.20.40',
    String(config.onlinePlayers ?? 0),
    String(config.maxPlayers ?? 100),
    config.serverId || '0',
    config.subMotd || '',
    config.gamemode || 'Survival',
    '1',
    String(config.bedrockPort ?? 19132),
    String((config.bedrockPort ?? 19132) + 1),
  ];
  return fields.join(';') + ';';
}

function startBedrockServer(config, log) {
  const serverGuid = crypto.randomBytes(8);
  const socket = dgram.createSocket('udp4');

  socket.on('message', (msg, rinfo) => {
    if (msg.length < 1) return;
    const packetId = msg[0];
    if (packetId !== UNCONNECTED_PING) return;
    if (msg.length < 1 + 8 + 16 + 8) return; // id + timestamp + magic + client guid

    const timestamp = msg.subarray(1, 9);
    const magic = msg.subarray(9, 25);
    if (!magic.equals(RAKNET_MAGIC)) return;

    const motd = buildMotdString(config);
    const motdBuf = Buffer.from(motd, 'utf8');
    const lengthBuf = Buffer.alloc(2);
    lengthBuf.writeUInt16BE(motdBuf.length, 0);

    const response = Buffer.concat([
      Buffer.from([UNCONNECTED_PONG]),
      timestamp,
      serverGuid,
      RAKNET_MAGIC,
      lengthBuf,
      motdBuf,
    ]);

    socket.send(response, rinfo.port, rinfo.address);
  });

  socket.on('error', (err) => {
    log(`Bedrock server error: ${err.message}`);
  });

  socket.bind(config.bedrockPort, () => {
    log(`Bedrock Edition status server listening on UDP port ${config.bedrockPort}`);
  });

  return socket;
}

module.exports = { startBedrockServer };
