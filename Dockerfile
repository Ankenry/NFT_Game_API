FROM node:16 AS build

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build
EXPOSE 3300

CMD ["npm", "run", "start"]