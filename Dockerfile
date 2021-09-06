FROM node:14-alpine

WORKDIR /app

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install

COPY . .

RUN npm i --save-dev @types/ws

RUN npm run clean

RUN npm run build

CMD [ "node", "/app/dist/client.js" ]
