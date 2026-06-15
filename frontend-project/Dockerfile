FROM node:22-bookworm-slim AS deps

WORKDIR /app

COPY package.json ./
RUN npm install

FROM deps AS build

ARG VITE_API_URL=http://localhost:3000/api
ARG VITE_WS_URL=ws://localhost:3000
ARG VITE_GOOGLE_CLIENT_ID=

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_WS_URL=${VITE_WS_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./
COPY components.json ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
