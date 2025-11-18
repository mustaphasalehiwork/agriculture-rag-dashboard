# Local Deployment Guide

This guide shows how to run the Agriculture RAG Dashboard locally without Docker.

## Prerequisites

- Node.js 18+
- npm or yarn
- A PostgreSQL database (optional for development)

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Set Environment Variables

Create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# Authentication (for local testing)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
SESSION_SECRET=your_session_secret
```

### 3. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The application will be available at:
- Development: `http://localhost:3000`
- Production: `http://localhost:3000`

## Environment Variables

### Required Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `JWT_SECRET`: Secret for JWT token signing

### Optional Variables

- `NODE_ENV`: Environment (development/production)
- `ADMIN_USERNAME`: Default admin username
- `ADMIN_PASSWORD`: Default admin password
- `SESSION_SECRET`: Secret for session management

## Database Setup (Optional)

For local development, you can either:

1. **Use Supabase**: Keep using your existing Supabase database
2. **Use local PostgreSQL**: Set up a local PostgreSQL instance

### Local PostgreSQL Setup

1. Install PostgreSQL on your system
2. Create a database:
   ```sql
   CREATE DATABASE agriculture_rag;
   ```
3. Update your database connection in the application code

## Development

### Running in Development Mode

```bash
npm run dev
```

This starts the development server with hot reloading.

### Building for Production

```bash
npm run build
npm start
```

This builds the optimized production version and starts the server.

## Features

- 🌾 Agriculture document management
- 📄 PDF upload and processing
- 🔍 RAG-based search functionality
- 🔐 User authentication
- 📊 Dashboard and reporting
- 📱 Responsive design

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can change it by setting the PORT environment variable:

```bash
PORT=3001 npm run dev
```

### Database Connection Issues

- Verify your Supabase credentials in `.env.local`
- Check if your Supabase project is active
- Ensure your IP is allowed in Supabase settings

### Build Issues

- Clear the build cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for any TypeScript errors: `npm run lint`

## Production Deployment Options

Once the application is running locally, you can deploy it using:

1. **Vercel**: Connect your GitHub repository to Vercel
2. **Netlify**: Deploy using the `npm run build` output
3. **Traditional hosting**: Build and run on any Node.js server
4. **Platform.sh**: Deploy to managed hosting platform

## Security Notes

- Change default admin credentials before production
- Use environment-specific secrets
- Enable HTTPS in production
- Regularly update dependencies

## Support

For issues related to the application functionality:
1. Check the browser console for errors
2. Verify your environment variables
3. Check the server logs for detailed error information