# Voting System

A secure full-stack voting system built with Next.js 14, TypeScript, Prisma, and PostgreSQL.

## Features

- 🗳️ Public voting with QR codes
- 👨‍💼 Admin dashboard with analytics
- 📊 Real-time vote tracking and charts
- 🔒 Secure authentication
- 📱 Responsive design
- 🚫 Duplicate vote prevention

## Quick Setup

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Set up Environment Variables
Copy `.env.example` to `.env.local` and update the values:
\`\`\`bash
cp .env.example .env.local
\`\`\`

**Required variables:**
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: A secure random string

### 3. Set up Database
\`\`\`bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed with sample data
npm run db:seed
\`\`\`

### 4. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

Visit `http://localhost:3000` to see the application.

## Admin Access

- **URL**: `http://localhost:3000/admin`
- **Password**: `admin123` (change in production)

## Team Voting URLs

After seeding, you'll get URLs like:
- `http://localhost:3000/vote/[teamId]`

## Voting Rules

- Each user can vote up to **2 times per track per email**
- Duplicate votes for the same team are prevented
- Vote counts are tracked both server-side and client-side

## Production Deployment

1. Set up a PostgreSQL database (recommended: Neon)
2. Update environment variables
3. Deploy to Vercel
4. Run database migrations

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | NextAuth secret key | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of admin password | Yes |
