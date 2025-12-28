FROM node:20-bullseye

WORKDIR /usr/src/app
RUN mkdir ./uploads

COPY package*.json ./
RUN npm install

CMD ["npm", "run", "dev"]
