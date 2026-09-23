FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY lib ./lib
COPY config.json ./

EXPOSE 25565/tcp
EXPOSE 19132/udp

CMD ["node", "server.js"]
