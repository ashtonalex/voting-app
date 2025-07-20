# Voting System

A modern, secure voting platform built with Next.js 14, featuring real-time analytics, QR code management, and comprehensive admin controls.

## 🚀 Features

- **Public Voting System**: Team-based voting with customizable limits
- **Admin Dashboard**: Real-time analytics, vote management, and reporting
- **QR Code Generation**: Bulk QR code creation and PDF export
- **Anti-Fraud Protection**: Vote limits, unique constraints, and optional CAPTCHA
- **Real-time Updates**: Live vote counting and analytics
- **Secure Authentication**: Admin-only access with session management

## 🛠 Tech Stack

**Frontend & Backend:**
- Next.js 14 (React 18, TypeScript)
- App Router for both pages and API routes

**Database & ORM:**
- PostgreSQL
- Prisma ORM (@prisma/client 6.12.0)

**Styling & UI:**
- TailwindCSS 3.4.17
- Recharts for data visualization
- QR code generation (qrcode/react-qr-code)

**Authentication & Security:**
- NextAuth.js 4.24.5
- bcryptjs for password hashing
- Zod for validation

**Data Management:**
- SWR for data fetching and caching
- Axios for HTTP requests
- js-cookie for client-side state

**Testing & Performance:**
- k6 for load testing
- Built-in performance optimization via Next.js

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── vote/              # Public voting pages
│   ├── qr/                # QR code management
│   └── api/               # API routes
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
│   ├── prisma.ts         # Database connection
│   ├── auth.ts           # Authentication helpers
│   └── validations.ts    # Zod schemas
├── prisma/               # Database schema and migrations
├── scripts/              # Utility and setup scripts
├── k6/                   # Load testing scripts
└── public/               # Static assets
```

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voting-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/voting_db"
   
   # Authentication
   NEXTAUTH_SECRET="your-nextauth-secret"
   ADMIN_PASSWORD_HASH="your-bcrypt-hashed-password"
   
   # Optional CAPTCHA
   CAPTCHA_ENABLED=false
   NEXT_PUBLIC_CAPTCHA_ENABLED=false
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## 🗄 Database Schema

The system uses three main models:

- **Team**: Voting teams with slugs and metadata
- **Vote**: Individual votes linking emails to teams and tracks
- **Track**: Enum for different voting categories

Key constraints:
- Unique votes per email-team combination
- Vote limits: 2 votes per track, 1 per team
- Audit trail with timestamps

## 🔐 Authentication

**Admin Authentication:**
- Session-based authentication via NextAuth.js
- Bcrypt password hashing
- Protected admin routes and API endpoints

**Public Voting:**
- No login required
- Cookie-based vote tracking
- Email required for vote submission

## 📊 Voting System

**Vote Flow:**
1. Users access team-specific voting URLs (`/vote/[teamSlug]`)
2. Vote limits enforced on both frontend and backend
3. Votes validated and stored with unique constraints
4. Real-time analytics updated via SWR

**Security Features:**
- Duplicate vote prevention
- Input validation with Zod
- Optional CAPTCHA protection
- Audit trail for all votes

## 🎯 Admin Dashboard

Access the admin dashboard at `/admin` with the following features:

- **Real-time Analytics**: Vote counts, charts, and trends
- **Vote Management**: View, filter, and manage all votes
- **Team Management**: Add, edit, and remove voting teams
- **QR Code Export**: Generate and download QR codes for all teams
- **Data Export**: Export voting data for analysis

## 🏗 API Architecture

RESTful API endpoints located in `app/api/`:

- `POST /api/vote` - Submit a vote
- `GET /api/admin/dashboard` - Dashboard analytics
- `GET /api/admin/votes` - Vote management
- `GET /api/admin/teams` - Team management
- `POST /api/admin/export` - Data export
- `/api/auth/*` - Authentication endpoints

All endpoints include:
- Input validation with Zod
- Error handling with standard HTTP codes
- Authentication middleware for admin routes

## ⚡ Performance

**Optimization Features:**
- SWR for efficient data fetching and caching
- Prisma for optimized database queries
- Next.js automatic code splitting and optimization
- TailwindCSS for minimal CSS bundle size

**Load Testing:**
- k6 scripts included in `/k6` directory
- Performance monitoring and benchmarking tools

## 🚀 Deployment

**Recommended: Vercel**
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on git push

**Alternative: Node.js Hosting**
1. Build the application: `npm run build`
2. Start the server: `npm start`
3. Ensure PostgreSQL database is accessible

## 🧪 Testing

**Load Testing:**
```bash
# Run k6 load tests
cd k6
k6 run load-test.js
```

**Development Testing:**
- Use development scripts in `/scripts` directory
- Test voting flows and admin functions locally

## 🔧 Configuration

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Secret for session encryption
- `ADMIN_PASSWORD_HASH` - Bcrypt hash of admin password

**Optional Environment Variables:**
- `CAPTCHA_ENABLED` - Enable server-side CAPTCHA
- `NEXT_PUBLIC_CAPTCHA_ENABLED` - Enable client-side CAPTCHA

## 🛡 Security Considerations

- **SQL Injection**: Prevented by Prisma ORM
- **XSS**: React automatically escapes output
- **CSRF**: Protected by NextAuth.js and SameSite cookies
- **Password Security**: Bcrypt hashing with salt
- **Input Validation**: Comprehensive Zod schemas
- **Session Security**: Secure, HttpOnly, SameSite cookies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Check the documentation in `/docs`
- Review the API documentation
- Open an issue on GitHub

## 🔄 Data Flow Overview

```
User Vote Flow:
User → /vote/[teamSlug] → Validation → Database → Real-time Updates

Admin Flow:
Admin → Login → Dashboard → Analytics/Management → Database

QR Code Flow:
Admin → /qr/production → Team Data → QR Generation → PDF Export
```
