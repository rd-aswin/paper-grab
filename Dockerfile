FROM ghcr.io/puppeteer/puppeteer:21.5.2

# Skip Chromium download for the app installation step because it's already in the base image
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .

CMD [ "node", "server.js" ]
