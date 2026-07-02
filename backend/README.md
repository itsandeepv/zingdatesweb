# Peppy Backend — Laravel 11 API

## Run with Docker (Recommended — no PHP/Composer install needed)

### Requirements
- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) — only this is needed

### Start the backend

```bash
# 1. Copy the Docker environment file
copy .env.docker .env

# 2. Build and start all containers (PHP app + MySQL + Redis)
docker-compose up --build

# 3. In a second terminal — run migrations and seed data
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan migrate --seed
```

The API is now running at **http://localhost:8000**

### Useful Docker commands

```bash
# Stop all containers
docker-compose down

# View app logs
docker-compose logs -f app

# Run any artisan command
docker-compose exec app php artisan <command>

# Open MySQL shell
docker-compose exec mysql mysql -u peppy -psecret peppy_db

# Restart after code change
docker-compose restart app
```

---

## Run without Docker (requires PHP 8.2 + Composer + MySQL)

```bash
composer install
cp .env.example .env
php artisan key:generate
# Configure DB credentials in .env, then:
php artisan migrate --seed
php artisan serve --port=8000
```

---

## API Base URL

```
http://localhost:8000/api
```

Set in Next.js frontend `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## Default Admin Login (after seeding)

| Field    | Value           |
|----------|----------------|
| Email    | admin@peppy.app |
| Password | Admin@123!      |

Change this password immediately after first login.

---

## API Routes Summary

### Public
```
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/login
POST /api/auth/register
POST /api/auth/social-login
POST /api/auth/admin/login
GET  /api/plans
GET  /api/events
GET  /api/blog
```

### Authenticated (Bearer token)
```
GET/PUT  /api/me
GET      /api/discover
POST     /api/connections/{userId}
GET      /api/conversations
POST     /api/messages/{userId}
POST     /api/calls/{userId}/initiate
POST     /api/subscriptions
POST     /api/payments/create-intent
POST     /api/payments/coins/recharge
GET/POST /api/support/tickets
GET      /api/notifications
```

### Admin
```
GET  /api/admin/dashboard/stats
GET  /api/admin/users
GET  /api/admin/payments
GET  /api/admin/events
GET  /api/admin/tickets
GET  /api/admin/staff
GET  /api/admin/analytics/overview
GET  /api/admin/seo/pages
GET  /api/admin/campaigns
GET  /api/admin/api-keys
GET  /api/admin/settings
```

---

## Project Structure

```
backend/
├── app/Http/Controllers/Auth/   ← AuthController
├── app/Http/Controllers/Api/    ← 11 user-facing controllers
├── app/Http/Controllers/Admin/  ← 13 CRM admin controllers
├── app/Http/Middleware/         ← AdminMiddleware, ForceJsonResponse
├── app/Models/                  ← 30 Eloquent models
├── app/Services/                ← OTP, Payment, Coins, Notifications
├── config/                      ← All Laravel config files
├── database/migrations/         ← 22 migration files
├── database/seeders/
├── routes/api.php               ← All API routes
├── artisan                      ← CLI entry point
├── public/index.php             ← Web entry point
├── Dockerfile
├── docker-compose.yml
├── .env.docker                  ← Pre-configured for Docker
└── .env.example
```

---

## License

Proprietary — CVInfotech / Peppy App. All rights reserved.
