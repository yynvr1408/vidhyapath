FROM node:22-alpine AS build

WORKDIR /app

# Install the npm workspace dependencies from the lockfiles before copying source.
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package-lock.json ./frontend/
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package-lock.json ./frontend/
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --omit=dev

COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/public ./backend/public

EXPOSE 3001
CMD ["npm", "start"]
