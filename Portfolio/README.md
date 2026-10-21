# Portfolio

Astro (static) + Decap CMS (free). All content lives in `src/content`.

## Run
    npm install
    npm run dev          # http://localhost:4321
    npm run build        # outputs dist/

## Edit content locally with the CMS
    npm run cms          # terminal 1
    npm run dev          # terminal 2
Open http://localhost:4321/admin

## Go live (free) and edit from any device
1. Create a GitHub repo and push this folder to it.
2. Set `repo: vijaykrishnan9745-hue/portfolio` in `public/admin/config.yml`.
3. Create a Netlify site from the repo (build: `npm run build`, publish: `dist`).
4. GitHub > Settings > Developer settings > OAuth Apps > New. Homepage = your site URL,
   callback = `https://api.netlify.com/auth/done`. Copy the Client ID and a new Client Secret.
5. Netlify > Site configuration > Access & security > OAuth > Install provider > GitHub, and paste both.
6. Open `https://your-site/admin`, log in with GitHub, edit and Publish. The site redeploys in about a minute.
Only people with write access to the repo can log in.

## Where things are
- `src/content/site.json`: name, headline, hero text, email, socials
- `src/content/about.json`: about text, timeline, photo carousel
- `src/content/garden.json`: draggable sandbox pieces
- `src/content/projects/*.md`: case studies
- `public/images/hero.png`: hero photo (sphere position is set in `src/scripts/sphere.js`)
- `npm run placeholders` regenerates the dummy artwork
