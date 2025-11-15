# Agriculture RAG Dashboard

A modern document management dashboard for RAG (Retrieval-Augmented Generation) systems, specifically designed for agricultural document processing. This Next.js application provides secure PDF upload, real-time processing tracking, and comprehensive analytics for document management.

## Features

### ✅ Core Features
- **Secure Authentication**: JWT-based login system with session management
- **PDF Upload**: Simple interface for uploading PDF files up to 10MB
- **Real-time Processing**: Live progress tracking with Server-Sent Events
- **Document Management**: View, delete, and manage uploaded documents
- **Modern UI**: Responsive design with Tailwind CSS and Shadcn/ui components
- **Mobile Responsive**: Sidebar navigation with mobile support

### ❌ Features Excluded
- **Evaluation System**: Quality assessment system completely removed
- **Automated Testing**: Self-testing capabilities on documents

### 🆕 Reports Section
Comprehensive analytics dashboard for document statistics and performance tracking.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/                   # Authentication APIs
│   │   │   ├── upload/                 # File upload API
│   │   │   ├── documents/              # Document management APIs
│   │   │   └── sse/                    # Server-Sent Events for progress
│   │   ├── dashboard/
│   │   │   ├── documents/              # Document management page
│   │   │   └── reports/                # 🆕 Analytics dashboard
│   │   ├── login/                      # Login page
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                    # Home page (redirects to login)
│   ├── components/
│   │   ├── ui/                         # Base UI components
│   │   ├── app-sidebar.tsx             # Sidebar navigation
│   │   ├── document-table.tsx          # Document list table
│   │   ├── upload-modal.tsx            # File upload modal
│   │   └── mobile-sidebar.tsx          # Mobile responsive sidebar
│   └── lib/
│       ├── auth.ts                     # Authentication utilities
│       ├── supabase.ts                 # Supabase client configuration
│       └── utils.ts                    # Helper functions
├── docs/
│   ├── README.md                       # Project documentation
│   └── DEPLOYMENT.md                   # Deployment guide
├── .env.example                        # Environment variables template
├── ecosystem.config.js                 # PM2 configuration
└── package.json                        # Project dependencies
```

## Tech Stack

### Frontend
- **Next.js 15.5.4**: React framework with App Router
- **React 19.1.0**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Styling framework
- **Shadcn/ui**: Component library
- **Lucide React**: Icon library

### Backend & Tools
- **Supabase**: Database and backend services
- **Jose**: JWT token management
- **Server-Sent Events**: Real-time progress updates
- **PM2**: Process management (production)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account for database

### 1. Clone and Install

```bash
git clone <repository-url>
cd agriculture-rag-dashboard
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

**Required Environment Variables:**

```env
# Node Environment
NODE_ENV=development

# Server Configuration
PORT=3000

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
SESSION_SECRET=generate_32_character_random_string

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# File Storage
UPLOAD_DIR=./uploads
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the following SQL in the Supabase SQL Editor:

```sql
CREATE TABLE ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  total_chunks INTEGER,
  chunks_processed INTEGER DEFAULT 0,
  current_step TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  document_id UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Enable all operations" ON ingestion_jobs FOR ALL;
```

### 4. Create Upload Directory

```bash
mkdir uploads
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and login with the credentials you configured.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Session verification

### Documents
- `POST /api/upload` - Upload new document
- `GET /api/documents` - List all documents
- `DELETE /api/documents/[id]` - Delete document
- `GET /api/sse/[jobId]` - Real-time progress updates

## Components Overview

### Authentication Flow
- JWT-based session management with httpOnly cookies
- Secure login with configurable credentials
- Automatic session expiration after 7 days

### Document Upload System
- PDF-only validation with 10MB size limit
- Real-time progress tracking via Server-Sent Events
- Automatic status updates (processing → completed/failed)
- File storage in local filesystem or configured path

### Responsive Design
- Mobile-first approach with collapsible sidebar
- Touch-friendly interface elements
- Adaptive layouts for all screen sizes

## Deployment

### Production Deployment with PM2

1. **Build the application:**
```bash
npm run build
```

2. **Configure environment variables** for production

3. **Start with PM2:**
```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | Yes |
| `PORT` | Server port | Yes |
| `ADMIN_USERNAME` | Login username | Yes |
| `ADMIN_PASSWORD` | Login password | Yes |
| `SESSION_SECRET` | JWT signing secret | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `UPLOAD_DIR` | File upload directory | No |

### Supabase Setup
The application requires a Supabase project with the `ingestion_jobs` table. See the Database Setup section above for the SQL schema.

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Session Management**: httpOnly cookies for session storage
- **File Validation**: PDF-only uploads with size limits
- **CORS Ready**: Configurable for production environments
- **Input Validation**: Server-side validation for all inputs

## Monitoring & Analytics

### Built-in Analytics
- Document upload trends (7-day view)
- Processing success rates
- Storage usage statistics
- Average processing times

### Performance Metrics
- Real-time document status tracking
- Chunk processing progress
- Error rate monitoring
- System resource usage

## Troubleshooting

### Common Issues

**Upload fails:**
- Check file size (max 10MB)
- Verify PDF format
- Check upload directory permissions

**Authentication issues:**
- Verify environment variables
- Check SESSION_SECRET format
- Clear browser cookies

**Database connection:**
- Verify Supabase credentials
- Check network connectivity
- Ensure table exists

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment issues
- Review the troubleshooting section
- Create an issue in the repository

---

**Developer**: Agriculture Tech Team
**Version**: 1.0.0
**Last Updated**: 2024