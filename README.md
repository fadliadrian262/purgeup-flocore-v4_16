# FLOCORE AI v4.16 - Construction Intelligence Platform

A sophisticated AI-powered construction intelligence platform that combines computer vision, engineering calculations, document automation, and project management into a unified interface.

**Converted from Google AI Studio to Local Development**

## ✨ Features

- 🤖 **Multi-modal AI Analysis** - Camera-based construction site analysis
- 📐 **Engineering Calculations** - 40+ specialized agents for structural & geotechnical analysis
- 📄 **Document Automation** - Automated generation of construction reports and compliance documents
- 🎙️ **Voice Interface** - Voice-activated AI co-pilot with speech recognition
- 🌍 **Multi-language Support** - English and Indonesian localization
- 📊 **Real-time Analytics** - Project dashboards and progress tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- NPM or Yarn
- Google Gemini API key

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set your Gemini API key in .env.local:**
   ```bash
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:** Navigate to `http://localhost:3000`

## 🛠️ Development

### Testing Local Setup
```bash
node test-local-setup.js
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build

## 📚 Key Technologies

- **Frontend**: React 19.1, TypeScript, TailwindCSS
- **Build Tool**: Vite 6.2
- **AI/ML**: Google Gemini API, WebLLM
- **Document Processing**: PDF-lib, MathJax

## 🚨 Troubleshooting

### Common Issues

1. **API Key Issues**: Verify `GEMINI_API_KEY` is set in `.env.local`
2. **Import Errors**: All ES Module imports converted to local npm packages
3. **MathJax Issues**: Now handled locally via npm package

**Original AI Studio App**: https://ai.studio/apps/drive/19_HzH-4n6J5jYSpo65ir9-_niSxDbmAF
