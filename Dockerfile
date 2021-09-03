FROM node:alpine
RUN apk add  --no-cache ffmpeg
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
ENTRYPOINT ["node", "index.js"]
EXPOSE 8080
