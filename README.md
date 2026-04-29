# Loopy Backend

> Interactive multi-language coding playground - Backend API

Node.js/Express backend API for the Loopy learning platform, providing code execution, AI-powered grading, and user management.

## 🚀 Features

- **Multi-Language Code Execution**: JavaScript, Python, C++
- **AI-Powered Auto-Grading**: Groq AI (primary) + Google Gemini (fallback)
- **Test Case Management**: Define and run automated tests
- **User Authentication**: Supabase-based authentication
- **Progress Tracking**: Track user learning progress
- **RESTful API**: Well-documented API endpoints
- **Rate Limiting**: Protect against abuse
- **Comprehensive Logging**: Winston-based logging

## 📋 Prerequisites

- Node.js 18+ (recommended: 20.x)
- npm 9+
- PostgreSQL 14+ (via Supabase)
- G++ compiler (for C++ execution)
- Python 3.8+ (for Python execution)

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/your-org/loopy-backend.git
cd loopy-backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration
```

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Code Execution Configuration
CODE_EXECUTION_TIMEOUT=5000
MAX_CODE_LENGTH=10000

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_CODE_EXECUTION=50

# AI Configuration (Auto-Grading)
# Groq AI (Primary - 14,400 RPD free tier)
GROQ_API_KEY=your_groq_api_key

# Gemini AI (Fallback - 20 RPD free tier)
GEMINI_API_KEY=your_gemini_api_key

AI_PRIMARY_PROVIDER=groq
AI_FALLBACK_ENABLED=true

# Logging
LOG_LEVEL=info
```

## 🗄️ Database Setup

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Copy your project URL and keys

### 2. Run Database Migrations

```bash
# Run schema creation
psql -h your-db-host -U postgres -d your-db-name -f database/schema.sql

# Run migrations (if any)
cd database/migrations
# Execute migration files in order
```

### 3. Seed Data (Optional)

```bash
# Run seed scripts
npm run seed
```

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   │   ├── ai-analyzer.service.ts
│   │   ├── groq-analyzer.service.ts
│   │   ├── grading-orchestrator.service.ts
│   │   ├── javascript-executor.service.ts
│   │   ├── python-executor.service.ts
│   │   └── cpp-executor.service.ts
│   ├── middleware/     # Express middleware
│   ├── routes/         # API routes
│   ├── schemas/        # Validation schemas
│   ├── db/             # Database utilities
│   ├── config/         # Configuration
│   └── utils/          # Utility functions
├── database/
│   ├── schema.sql      # Database schema
│   └── migrations/     # Database migrations
├── logs/               # Application logs
├── .env.example        # Environment template
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

Most endpoints require authentication via Supabase JWT token:

```
Authorization: Bearer <your_jwt_token>
```

### Key Endpoints

#### Code Execution
```
POST /api/execute
Body: { code: string, language: string }
```

#### Grading
```
POST /api/grading/exercises/:exerciseId/submit
Body: { code: string, language: string }
```

#### User Progress
```
GET /api/progress
```

For complete API documentation, visit `/api-docs` when the server is running.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- grading-orchestrator.service.test.ts
```

## 🎨 Code Quality

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Run all quality checks
npm run quality:check
```

## 🤖 AI Grading System

### Providers

1. **Groq AI** (Primary)
   - Llama 3.1 8B: 14,400 requests/day
   - Llama 3.3 70B: 1,000 requests/day
   - Fast response (~800ms)

2. **Google Gemini** (Fallback)
   - Gemini 2.5 Flash: 20 requests/day
   - Gemini 2.0 Flash: 20 requests/day

3. **Test-Only** (Emergency)
   - Unlimited capacity
   - No AI feedback

### Cascading Fallback

```
Groq 8B → Groq 70B → Gemini 2.5 → Gemini 2.0 → Test-Only
```

### Grading Depth

- **quick**: Fast feedback (~800ms)
- **careful**: Standard analysis (~1000ms)
- **thorough**: Deep analysis (~1500ms)

## 🔒 Security

- **Rate Limiting**: Prevents abuse
- **Input Validation**: Zod schemas
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Helmet middleware
- **CORS**: Configured for frontend origin
- **Environment Variables**: Sensitive data in .env

## 🌐 Deployment

### Render (Recommended)

1. Create a new Web Service on [Render](https://render.com/)
2. Connect your GitHub repository
3. Set environment variables
4. Deploy

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Docker (Optional)

```bash
# Build Docker image
docker build -t loopy-backend .

# Run container
docker run -p 3000:3000 --env-file .env loopy-backend
```

## 📊 Monitoring

### Logs

Logs are stored in `logs/` directory:
- `combined.log`: All logs
- `error.log`: Error logs only

### Health Check

```
GET /api/health
```

## 🔗 Frontend Application

This backend serves the Loopy Frontend application.

**Frontend Repository**: [loopy-frontend](https://github.com/your-org/loopy-frontend)

## 📦 Tech Stack

- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **AI Providers**: Groq AI, Google Gemini
- **Code Execution**: Node.js VM, Python subprocess, G++ compiler
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🐛 Bug Reports

If you find a bug, please open an issue on [GitHub Issues](https://github.com/your-org/loopy-backend/issues).

## 📧 Contact

- **Email**: your-email@example.com
- **GitHub**: [@your-username](https://github.com/your-username)

## 🙏 Acknowledgments

- Built with [Express.js](https://expressjs.com/)
- Powered by [Supabase](https://supabase.com/)
- AI by [Groq](https://groq.com/) and [Google Gemini](https://ai.google.dev/)

---

**Note**: This is the backend API. For the complete platform, you also need the [frontend application](https://github.com/your-org/loopy-frontend).
