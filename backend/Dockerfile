# Backend production image
FROM node:20-bullseye-slim AS base

WORKDIR /usr/src/app/backend

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p database uploads/documents

ARG PORT=3001
ARG APP_VERSION=dev
ENV PORT=${PORT}
ENV APP_VERSION=${APP_VERSION}
EXPOSE ${PORT}

CMD ["npm", "start"]
