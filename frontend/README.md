# Pixel Perfect Prompt

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pixel-perfect-prompt-68.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/23490158-3186-4032-a1af-35d4d6de04eb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

The Supabase client in `src/lib/supabase.ts` reads `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` from `.env.local`. Keep that file out of version control.
The existing patient storage and transcription API are unchanged; this client does
not move data to Supabase by itself.
