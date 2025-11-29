# VSol E-Commerce Platform

## Installation

1. Install dependencies: [git](https://git-scm.com), [node.js](https://nodejs.org), [bun](https://bun.sh), [docker](https://www.docker.com/get-started)

2. Clone and setup:

   ```bash
   git clone <repository-url>
   cd vsol-e-commerce
   bun install
   cp .env.example .env
   ```

3. Configure environment variables in `.env`:
   - `DATABASE_URL` - PostgreSQL connection string
   - `AUTH_SECRET` - Generate with: `bunx randomstring length=32`
   - `NEXT_PUBLIC_APP_URL` - Public app URL
   - `NEXT_SERVER_APP_URL` - Server app URL
   - Optional: OAuth (Google/GitHub), Uploadthing, Stripe payment credentials

4. Start database:

   ```bash
   bun db:start  # starts postgres in docker
   ```

5. Update `.env` with docker database:

   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vsol_ecommerce?sslmode=disable"
   ```

6. Initialize database and start:

   ```bash
   bun db:push  # apply schema
   bun dev      # start dev server on port 8080
   ```

## Commands

| Command         | Description                    |
|----------------|--------------------------------|
| `bun dev`      | start development server       |
| `bun build`    | create production build         |
| `bun db:push`  | apply database schema changes  |
| `bun db:auth`  | update auth-related tables      |
| `bun db:studio`| open visual database editor    |
| `bun db:start` | start postgres in docker        |
| `bun db:stop`  | stop postgres container        |
| `bun db:reset` | reset database (removes data)  |

## Deployment to Render

### Prerequisites

1. Create a [Render](https://render.com) account
2. Connect your GitHub repository

### Database Setup

1. Create a new PostgreSQL database in Render
2. Copy the Internal Database URL from Render dashboard
3. Add to environment variables: `DATABASE_URL`

### Web Service Setup

1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `bun install && bun run build`
   - **Start Command**: `bun start` (or `node server.js` if using custom server)
   - **Environment**: Node
   - **Node Version**: 20.x or later

4. Set environment variables in Render dashboard:

   ```
   DATABASE_URL=<from-postgres-service>
   AUTH_SECRET=<generate-secure-random-string>
   NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
   NEXT_SERVER_APP_URL=https://your-app.onrender.com
   BETTER_AUTH_SECRET=<same-as-AUTH_SECRET-or-separate>
   ```

   Add other required variables from `.env.example` as needed.

5. Deploy:
   - Render will auto-deploy on git push to main branch
   - Or manually trigger deployment from dashboard

### Post-Deployment

1. Run database migrations:

   ```bash
   bun db:push
   ```

   Or use Render's shell/SSH to run migrations after deployment

2. Verify:
   - Check application logs in Render dashboard
   - Test authentication endpoints
   - Verify database connections

### Environment Variables for Production

Required:

- `DATABASE_URL` - PostgreSQL connection string from Render
- `AUTH_SECRET` or `BETTER_AUTH_SECRET` - Secure random string (32+ chars)
- `NEXT_PUBLIC_APP_URL` - Your Render app URL
- `NEXT_SERVER_APP_URL` - Your Render app URL

Optional (for full functionality):

- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - Google OAuth
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` - GitHub OAuth
- `UPLOADTHING_TOKEN` / `UPLOADTHING_SECRET_KEY` - File uploads
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Payment processing
- `RESEND_API_KEY` - Transactional emails

## Troubleshooting

- **Database connection errors**: Verify `DATABASE_URL` format and credentials
- **Auth errors**: Ensure `AUTH_SECRET` is set and at least 32 characters
- **Build failures**: Check Node version matches Render environment (20.x+)
- **Port issues**: Render automatically assigns port via `PORT` env var

## License

Proprietary © 2025 VSol Software. All rights reserved.
