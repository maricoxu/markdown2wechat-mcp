FROM node:22-alpine

WORKDIR /app

ARG NPM_REGISTRY=https://registry.npmjs.org/
RUN npm config set registry ${NPM_REGISTRY}

COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm install --production
RUN npm install typescript
RUN npx tsc -b && npm run copy-assets
CMD ["node", "dist/index.js"]
