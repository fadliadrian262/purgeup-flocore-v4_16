# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FLOCORE AI v4.16** is a sophisticated construction intelligence platform that combines AI analysis, engineering calculations, document automation, and project management. Originally developed as a Google AI Studio app and converted to local development.

### Key Technologies
- **Frontend**: React 19.1, TypeScript, TailwindCSS
- **Build Tool**: Vite 6.2 with ES modules
- **AI/ML**: Google Gemini API, WebLLM for local inference
- **Document Processing**: PDF-lib, MathJax for mathematical rendering

## Development Commands

### Essential Commands
```bash
# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Test local setup and configuration
node test-local-setup.js
```

### Environment Setup
- Create `.env.local` with `GEMINI_API_KEY=your_api_key_here`
- The test script (`test-local-setup.js`) verifies all dependencies and configuration

## Architecture Overview

### Core Structure
```
App.tsx                 # Main application entry with state management
├── components/         # 40+ React components for UI
├── services/          # Business logic and API integrations
│   ├── agents/        # Specialized AI agents (40+ engineering agents)
│   └── *Service.ts    # Core services (auth, document, PDF, etc.)
├── hooks/             # Custom React hooks
├── contexts/          # React context providers
├── types.ts           # TypeScript type definitions
└── utils/             # Utility functions
```

### Agent-Based Architecture
The system uses a multi-agent architecture coordinated by `supervisorAgent.ts`:

- **Supervisor Agent**: Routes tasks to appropriate specialist agents based on intent detection
- **Specialist Agents**: 40+ domain-specific agents organized by discipline:
  - `structural/` - Structural engineering calculations (beams, columns, connections, etc.)
  - `geotechnical/` - Geotechnical analysis (foundations, slopes, settlements)
  - `hse/` - Health, Safety & Environment documentation
  - `quality/` - Quality management and inspection reports
  - `siteManager/` - Site management documentation and reports
  - `field/` - Field-specific operations and reports

### Key Services
- **geminiService**: Central AI service wrapper for Google Gemini API
- **pdfService**: PDF generation and processing using PDF-lib
- **authService**: User authentication and session management
- **documentService**: Document templates and generation
- **projectService**: Project data management

### Path Aliases
The project uses TypeScript path aliases configured in both `tsconfig.json` and `vite.config.ts`:
```typescript
"@/*": ["./*"]
"@components/*": ["./components/*"]
"@services/*": ["./services/*"]
"@hooks/*": ["./hooks/*"]
"@contexts/*": ["./contexts/*"]
"@utils/*": ["./utils/*"]
"@types": ["./types.ts"]
```

## Key Features & Components

### Multi-Modal AI Analysis
- Camera-based construction site analysis via `CameraView.tsx`
- Voice interface with speech recognition (`useSpeechRecognition.ts`)
- Multi-language support (English/Indonesian) via `LocalizationContext.tsx`

### Document Generation
- Automated construction reports and compliance documents
- LaTeX mathematical rendering via `LatexRenderer.tsx`
- PDF export with `html2canvas` for visual elements
- Template system with customizable report templates

### Engineering Calculations
- 40+ specialized calculation agents for structural and geotechnical analysis
- Real-time calculation results with mathematical formatting
- Compliance with various engineering standards and codes

## Development Notes

### Import Patterns
- All imports use ES modules syntax
- External dependencies are bundled via npm (no CDN imports)
- Dynamic imports used for code splitting where appropriate

### State Management
- React hooks and context for global state
- No external state management library (Redux, Zustand, etc.)
- Local component state with `useState` and `useEffect`

### Error Handling
- Construction site noise compensation in AI transcript processing
- Graceful fallbacks for API failures and network issues
- User feedback via toast notifications

### Build Configuration
- Vite configured with environment variable injection
- Source maps enabled for debugging
- Optimized dependencies pre-bundled
- Alias resolution for clean imports

## Testing & Quality

### Setup Verification
Use `node test-local-setup.js` to verify:
- Environment variables are set
- All dependencies are available
- Required files exist
- Gemini service is configured correctly

### Key Files to Preserve
- `metadata.json` - Project metadata
- `locales/*.json` - Internationalization files
- `public/assets/` - Static assets and media files