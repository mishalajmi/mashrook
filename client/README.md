# Mashrook Client

A React application with server-side rendering deployed on Cloudflare Workers.

## Tech Stack

- React 19
- React Router 7.6.3
- TailwindCSS 4
- Cloudflare Workers (SSR)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

## Project Structure

```
client/
  app/
    routes/          # React Router routes
    entry.server.jsx # SSR entry point
    root.jsx         # Root component
    routes.js        # Route configuration
    worker.js        # Cloudflare Worker entry
    index.css        # Global styles
  public/            # Static assets
  wrangler.jsonc     # Cloudflare configuration
```

## Resources

- [React Router Documentation](https://reactrouter.com/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
