FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN bun build src/app/main.ts --outdir src/public/dist --minify

FROM oven/bun:1-slim
WORKDIR /app
COPY --from=build /app/src/server.ts ./src/server.ts
COPY --from=build /app/src/public ./src/public
USER bun
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD bun -e "const r = await fetch('http://localhost:3000'); if (!r.ok) process.exit(1);"
CMD ["bun", "src/server.ts"]
