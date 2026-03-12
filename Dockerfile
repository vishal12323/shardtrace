FROM --platform=linux/amd64 node:20-alpine
USER root

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY services/ ./services/
COPY data/ ./data/
COPY docs/ ./docs/

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

WORKDIR /app/apps/coordinator

EXPOSE 4000

CMD ["pnpm", "exec", "tsx", "src/server.ts"]