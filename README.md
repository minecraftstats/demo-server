# demo-server
A Minecraft Server this emulate Java and Bedrock to show the fetures of mcstats.de Server Status

## What this is

A lightweight Node.js server that emulates the status-query protocols of both **Minecraft: Java Edition** and **Minecraft: Bedrock Edition**, without running an actual game server. It exists so tools like [mcstats.de Server Status](https://mcstats.de) can be pointed at it to demonstrate what a server status widget looks like — MOTD, player count, sample players, version, etc.

- **Java Edition**: implements the [Server List Ping](https://wiki.vg/Server_List_Ping) protocol over TCP (handshake, status request/response, ping/pong).
- **Bedrock Edition**: implements RakNet's Unconnected Ping/Pong over UDP, returning the `MCPE;...` MOTD string.

No real world, players, or gameplay — just enough of the protocol to answer status pings.

## Requirements

- [Node.js](https://nodejs.org/) 16 or newer (uses only built-in modules, no dependencies).

## Usage

```bash
npm start
```

By default this starts:

- the Java status server on TCP port `25565`
- the Bedrock status server on UDP port `19132`

Then point a status checker (e.g. mcstats.de) at your host/IP on the relevant port.

## Configuration

Edit [`config.json`](config.json) to customize the response:

| Field | Description |
| --- | --- |
| `javaPort` / `bedrockPort` | Ports to listen on |
| `motd` / `subMotd` | Server description shown to players |
| `versionName` / `protocolVersion` | Java Edition version info |
| `bedrockVersionName` / `bedrockProtocolVersion` | Bedrock Edition version info |
| `maxPlayers` / `onlinePlayers` | Player counts shown in the status |
| `samplePlayers` | Names shown in the Java status player sample |
| `gamemode` | Gamemode reported to Bedrock clients |
| `faviconPath` | Optional path to a 64x64 PNG used as the Java server icon |

## Project structure

```
server.js            # entry point, starts both status servers
config.json           # server metadata (MOTD, players, versions, ports)
lib/varint.js         # VarInt encode/decode helper for the Java protocol
lib/javaServer.js      # Java Edition Server List Ping implementation (TCP)
lib/bedrockServer.js   # Bedrock Edition RakNet Unconnected Ping implementation (UDP)
```
