# Setup

Running this project requires setting up a few environment variables and installing dependencies. Follow the instructions below to get everything up and running.

## Requirements

- Bun

# Installation

1. Clone the project and install dependencies:

```bash
git clone https://github.com/pratikdev/test
cd test
bun i
```

2. Setup and seed Convex

```bash
bun run convex
bun run convex:seed
```

3. Fill `.env.local` with the required environment variables (Check `.env.example`)

4. Set `GOOGLE_GENERATIVE_AI_API_KEY` environment variable in Convex if you haven't already

```bash
bun run convex:env:set GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

5. Start the development server:

```bash
bun run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.
