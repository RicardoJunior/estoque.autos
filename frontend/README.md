# Estoque.autos - Frontend

React frontend application for the Estoque.autos SaaS platform.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **UI Framework**: DaisyUI (Tailwind CSS)
- **Routing**: React Router v6
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **API Client**: Axios
- **Authentication**: Supabase Auth
- **Testing**: Jest + React Testing Library

## Architecture

The project follows Atomic Design principles:

- **`src/components/atoms/`** - Basic building blocks (Button, Input, etc.)
- **`src/components/molecules/`** - Simple component groups
- **`src/components/organisms/`** - Complex components (Header, Sidebar, etc.)
- **`src/components/templates/`** - Page layouts
- **`src/pages/`** - Full pages with data

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Configure your Supabase credentials in .env
```

### Environment Variables

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:5000/api
VITE_ENV=development
```

### Development

```bash
# Start development server
npm run dev

# Server will run on http://localhost:3000
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── atoms/         # Basic components
│   │   ├── molecules/     # Composite components
│   │   ├── organisms/     # Complex components
│   │   └── templates/     # Page layouts
│   ├── pages/             # Application pages
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services
│   ├── store/             # Zustand stores
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   ├── assets/            # Static assets
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Public assets
├── __mocks__/             # Jest mocks
├── .env.example           # Environment template
├── jest.config.js         # Jest configuration
├── tailwind.config.js     # Tailwind/DaisyUI config
├── tsconfig.json          # TypeScript config
└── vite.config.ts         # Vite configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Key Features

- ✅ TypeScript with strict mode
- ✅ DaisyUI themes with customization support
- ✅ Path aliases (`@/` for `src/`)
- ✅ Authentication with Supabase
- ✅ Protected routes with role-based access
- ✅ Responsive layout with sidebar navigation
- ✅ Form validation with Zod
- ✅ Automatic API token refresh
- ✅ Test setup with Jest and RTL

## Development Guidelines

1. **Components**: Follow Atomic Design principles
2. **TypeScript**: Use strict typing, avoid `any`
3. **Styling**: Use DaisyUI classes, avoid custom CSS
4. **State**: Use Zustand for global state, React Hook Form for forms
5. **Testing**: Write tests for all components and critical flows
6. **Code Style**: Follow ESLint and Prettier rules

## Next Steps

- [ ] Implement remaining pages (Vehicles, Leads, Sales, etc.)
- [ ] Add form components for vehicle management
- [ ] Implement marketplace integrations
- [ ] Build public landing page templates
- [ ] Add E2E tests with Playwright
- [ ] Implement PWA features

## License

Proprietary - Estoque.autos SaaS
