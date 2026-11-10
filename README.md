# Aevum Technologies website

Static, multi-page site built with vanilla HTML, CSS and JavaScript. Vite builds the pages; Three.js is used for the optional homepage globe. There is no application server or live email backend configured by default.

## Local development

Requirements: Node.js 20 or later and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The development server is for local preview only.

## Build and preview

```sh
npm run build
npm run preview
```

The static site is written to `dist/`. Deploy the contents of that directory to a static host configured to serve the site from its domain root. The build includes Home, About, Services, Solutions, Careers, Contact, Privacy Policy and Terms of Use.

After confirming the production domain, build with its HTTPS origin to generate canonical URLs and `sitemap.xml`:

```sh
SITE_URL=https://www.example.com npm run build
```

Replace the example with Aevum's verified domain. Without `SITE_URL`, the build intentionally omits canonical URLs and the sitemap rather than publishing invented addresses.

The About page keeps its nine portrait paths together in `js/team.js`. See [TEAM-IMAGE-PATHS.md](./TEAM-IMAGE-PATHS.md) for the exact folder and path values. Eight team-member names, roles and biographies remain anonymised until Aevum confirms approved public details.

## Contact form and legal documents

The contact form validates fields in the browser and clearly states that it does not send or store submissions until a secure, approved backend is configured. Do not put credentials in frontend files. A production setup should use a server-side endpoint with rate limiting, spam controls and secure validation before messages are accepted.

The privacy policy and terms of use pages are draft documents for founder review and legal approval. They are not final approved legal documents and must not be treated as published final legal policy until reviewed.

## Theme and motion

The website follows the visitor's system color preference and reduced-motion preference. It does not store a separate theme preference. The home-page globe uses atmospheric motion and layered lighting designed to preserve the premium gold-and-black visual identity.

The source HTML pages can be served from the project root using VS Code Live Server after dependencies are installed. Vite remains the production bundler and writes deployable files to `dist/`.
