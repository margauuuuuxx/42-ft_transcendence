FROM node:20-bullseye

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./

COPY src ./src

COPY tools/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 7777

CMD ["/usr/local/bin/entrypoint.sh"]