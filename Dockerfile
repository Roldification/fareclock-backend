FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Use $PORT from environment, default to 8080 for local dev
ENV PORT=8080

EXPOSE 8080

CMD [ "node", "server.js" ]