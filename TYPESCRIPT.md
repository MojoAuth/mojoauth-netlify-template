# TypeScript Functions for MojoAuth Netlify Template

This project uses TypeScript for Netlify serverless functions while maintaining a simple HTML/CSS frontend.

## Development Workflow

### Setting up the environment

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start TypeScript compiler in watch mode and run Netlify dev server
npm run dev:functions

# Or just compile TypeScript files once
npm run build:functions
```

### Production Build

```bash
# Build everything for production
npm run build:all
```

## Structure

- `/netlify/functions/*.ts` - TypeScript source files for Netlify functions
- `/dist/netlify/functions/*.js` - Compiled JavaScript functions (deployed to Netlify)
- `/public` - Static HTML, CSS, and client-side JavaScript files

## Type Definitions

The project includes TypeScript definitions for:

- Netlify Functions API
- OpenID Connect client
- Node.js standard library

## Configuration

TypeScript configuration is managed in two files:

- `tsconfig.json` - Main TypeScript config (used for the extension)
- `tsconfig.functions.json` - Specific config for Netlify functions
