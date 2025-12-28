FROM node:20-bullseye

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

CMD ["npm", "run", "dev"]