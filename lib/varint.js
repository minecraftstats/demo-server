'use strict';

function writeVarInt(value) {
  const bytes = [];
  let v = value;
  do {
    let temp = v & 0x7f;
    v >>>= 7;
    if (v !== 0) temp |= 0x80;
    bytes.push(temp);
  } while (v !== 0);
  return Buffer.from(bytes);
}

// Reads a VarInt from buf starting at offset.
// Returns { value, length } or null if the buffer doesn't yet contain a full VarInt.
function readVarInt(buf, offset) {
  let numRead = 0;
  let result = 0;
  let position = offset;
  while (true) {
    if (position >= buf.length) return null;
    const byte = buf[position];
    position++;
    numRead++;
    result |= (byte & 0x7f) << (7 * (numRead - 1));
    if ((byte & 0x80) === 0) break;
    if (numRead > 5) throw new Error('VarInt is too big');
  }
  return { value: result, length: numRead };
}

module.exports = { writeVarInt, readVarInt };
