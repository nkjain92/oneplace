# OnePlace

OnePlace is a comprehensive YouTube/Podcast Summary Platform that enables users to generate concise summaries for video content, interact with an integrated Q&A system powered by LLM, and manage their content consumption via subscriptions and history. The platform supports both logged-in and anonymous users with persistent sessions and a seamless user experience.

![OnePlace Platform](https://github.com/yourusername/oneplace/assets/yourusername/oneplace-screenshot.png)

## Features

### Current Features

- **Content Summarization:** Generate concise summaries for YouTube videos and podcasts
- **Interactive Q&A:** Chat with videos using an AI-powered Q&A system
- **Channel Subscriptions:** Subscribe to channels and receive updates on new content
- **User Authentication:** Create accounts, login with persistent sessions
- **Content Discovery:** Find and explore channels and content
- **History Tracking:** Keep track of previously viewed and summarized content
- **Responsive Design:** Optimized for both desktop and mobile devices
- **Server Components:** Utilizes Next.js server components for improved performance

### Upcoming Features

- **Advanced Search Tools:** Enhanced search capabilities across content and summaries
- **Social Media Integration:** Share summaries on social media as images and links
- **Error Logging:** Comprehensive error tracking and reporting
- **Tag-Based Navigation:** Click on tags to find related content
- **Transcript Display:** View full transcripts alongside summaries
- **Timestamped Summaries:** Summaries with timestamps linking to specific video sections
- **Content Expansion:** Support for additional content types beyond YouTube and podcasts

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend:** Hosted Supabase for authentication and database
- **Hosting:** Vercel
- **AI Integration:** Vercel AI SDK with OpenAI
- **State Management:** Zustand
- **Form Validation:** Zod
- **Styling:** Tailwind CSS with shadcn/ui components
- **Authentication:** Supabase Auth
- **Database:** PostgreSQL (via Supabase)
- **API Integration:** YouTube Data API, Podcast APIs

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
   git clone https://github.com/nkjain92/oneplace.git
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
  - `ui` - Base UI components
  - `shared` - Shared components used across multiple pages
  - `[page-specific]` - Components specific to individual pages
- `src/lib` - Business logic, API clients, and utilities
  - `actions` - Server actions for form submissions and data mutations
  - `utils` - Utility functions
  - `supabase` - Supabase client configuration
- `src/store` - Zustand state management
- `src/scripts` - Utility scripts (like RSS feed updater)
- `src/types` - TypeScript type definitions
- `public` - Static assets like images and fonts
- `supabase` - Supabase configuration, migrations, and edge functions

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run update-rss` - Run the RSS feed update script to fetch new content from subscribed channels
- `npm run supabase:start` - Start the local Supabase development environment
- `npm run supabase:stop` - Stop the local Supabase development environment
- `npm run supabase:deploy` - Deploy Supabase edge functions

## Deployment

This application can be deployed on [Vercel](https://vercel.com/), the platform from the creators of Next.js.

1. Push your code to a GitHub, GitLab, or Bitbucket repository
2. Import the project in Vercel
3. Set up all the environment variables
4. Deploy

## Architecture

OnePlace uses a modern architecture leveraging Next.js server components for optimal performance:

- **Server Components:** Most pages use server components for data fetching and initial rendering
- **Client Components:** Interactive elements use client components with the 'use client' directive
- **Hybrid Approach:** Combines server-side rendering with client-side interactivity
- **Edge Functions:** Utilizes Supabase Edge Functions for background tasks

## Performance Optimizations

- Server-side data fetching with `createSupabaseServerClient`
- Caching with `unstable_cache` for frequently accessed data
- Reduced client-side JavaScript with server components
- Optimized image loading with Next.js Image component
- Incremental Static Regeneration for static content

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [OpenAI](https://openai.com/)
- [Vercel](https://vercel.com/)
- [shadcn/ui](https://ui.shadcn.com/)
