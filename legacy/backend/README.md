# Estoque.autos Backend API

Backend API server for the Estoque.autos SaaS platform, built with Node.js, TypeScript, Express, and Supabase.

## Tech Stack

- **Runtime**: Node.js with TypeScript (strict mode)
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT + RLS)
- **Validation**: Zod
- **Testing**: Jest + Supertest

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── controllers/      # Request handlers
│   ├── validators/       # Zod schemas
│   ├── __tests__/        # Test files
│   ├── app.ts            # Express app setup
│   └── index.ts          # Server entry point
├── supabase/
│   └── migrations/       # Database migrations
└── package.json
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file:

```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Supabase anonymous key
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## API Endpoints

### Health Check

- `GET /api/health` - Server health status

### Authentication

- Coming soon...

### Vehicles

- Coming soon...

### Leads

- Coming soon...

## Middleware

- **helmet**: Security headers
- **cors**: Cross-origin resource sharing
- **compression**: Response compression
- **rate-limit**: Request rate limiting
- **auth**: JWT authentication
- **errorHandler**: Centralized error handling

## Testing

Tests are located in `src/__tests__/` and follow the naming convention `*.test.ts`.

Run tests with:

```bash
npm test
```

Coverage threshold:

- Branches: 70%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## License

ISC
