# Dayflow HRMS - Project Structure

## Directory Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Layout components (Sidebar, Navbar, etc.)
│   └── pages/             # Page-specific components
├── contexts/              # React Context providers
├── services/              # Data services and API layer
├── types/                 # TypeScript type definitions
├── lib/                   # Utility libraries
├── utils/                 # Utility functions
└── __tests__/             # Test files
    ├── components/        # Component tests
    ├── services/          # Service tests
    └── properties/        # Property-based tests
```

## Key Features

- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** with dark theme configuration
- **Lucide React** for consistent iconography
- **Service Layer Architecture** for easy backend integration
- **Role-based Access Control** for Employee and Admin users
- **Mock Data Layer** with localStorage persistence
- **Property-Based Testing** with fast-check

## Getting Started

```bash
npm run dev     # Start development server
npm test        # Run tests
npm run build   # Build for production
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Implementation Status

✅ **Task 1 Complete**: Project structure and core dependencies set up
- Next.js 14 with TypeScript and App Router configured
- Tailwind CSS with dark theme ready
- Lucide React installed for icons
- Complete directory structure created
- Service layer interfaces defined
- Core type definitions established
- Jest testing framework configured
- All placeholder components created for future implementation