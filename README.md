# URL Shortener (PERN + Redis)

## Features
- Shorten URLs
- Redirect with caching
- PostgreSQL with indexing
- Redis cache-aside pattern

## Tech Stack
- Node.js (Express)
- PostgreSQL
- Redis (Docker)

## Flow
GET /:code
→ Redis (cache)
→ DB (fallback)
→ Cache store
→ Redirect
