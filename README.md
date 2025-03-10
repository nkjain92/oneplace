# OnePlace

OnePlace is a comprehensive YouTube/Podcast Summary Platform that enables users to generate concise summaries for video content, interact with an integrated Q&A system powered by LLM, and manage their content consumption via subscriptions and history. The platform supports both logged-in and anonymous users with persistent sessions and a seamless user experience.

## Features

- **Content Summarization:** Generate summaries for YouTube videos
- **Interactive Q&A:** Chat with videos using an AI-powered Q&A system
- **Channel Subscriptions:** Subscribe to channels and receive updates
- **User Authentication:** Create accounts, login with persistent sessions
- **Content Discovery:** Find and explore channels and content

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend:** Hosted Supabase for authentication and database
- **Hosting:** Vercel
- **AI Integration:** Vercel AI SDK with OpenAI
- **AI SDK:** Vercel AI SDK
- **State Management:** Zustand
- **Form Validation:** Zod
- **Styling:** Tailwind CSS with shadcn/ui components

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)
- [Git](https://git-scm.com/)

You'll also need accounts with the following services:

- [Supabase](https://supabase.com/) - For authentication and database
- [RapidAPI](https://rapidapi.com/) - For YouTube transcript API
- [OpenAI](https://openai.com/) - For AI-powered summarization and Q&A
- [YouTube Data API](https://developers.google.com/youtube/v3) - For fetching channel details
- [Resend](https://resend.com/) - For sending email notifications (optional for development)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/oneplace.git
   cd oneplace
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Set up environment variables:

   - Copy the `.env.example` file to `.env`

   ```bash
   cp .env.example .env
   ```

   - Fill in the required environment variables with your actual API keys and settings

4. (Optional) Set up Supabase locally:
   - Install the Supabase CLI
   - Initialize Supabase project
   ```bash
   npx supabase init
   ```

## Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app` - Application routes and pages using the Next.js App Router
- `src/components` - Reusable UI components
- `src/lib` - Business logic, API clients, and utilities
- `src/store` - Zustand state management
- `src/scripts` - Utility scripts (like RSS feed updater)
- `src/types` - TypeScript type definitions
- `public` - Static assets like images and fonts
- `supabase` - Supabase configuration and migrations (if any)

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run update-rss` - Run the RSS feed update script to fetch new content from subscribed channels

## Deployment

This application can be deployed on [Vercel](https://vercel.com/), the platform from the creators of Next.js.

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Import the project in Vercel
3. Set up all the environment variables
4. Deploy

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
