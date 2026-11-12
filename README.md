# Aevum Technologies website

Static, multi-page site built with vanilla HTML, CSS and JavaScript. Vite builds the site; Cloudflare Pages serves the files and runs the contact endpoint in `functions/`. Three.js is used for the optional homepage globe.

## Local development

Requirements: Node.js 20 or later and npm.

For static-page editing with Vite:

```sh
npm install
npm run dev
```

The Vite server does not run Pages Functions. To exercise the complete contact flow locally, create an ignored `.dev.vars` file in the project root with your own test credentials:

```text
RESEND_API_KEY=your_resend_api_key
CONTACT_FROM_EMAIL=Aevum <sender@your-verified-domain>
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
TURNSTILE_SITE_KEY=your_turnstile_site_key
```

Register the local hostname you use (usually `localhost`) in the Turnstile widget. Never commit `.dev.vars` or put secrets in frontend files. Build and run the Pages development server:

```sh
npm run build
npx wrangler pages dev dist
```

Wrangler serves the built site and runs `functions/api/contact.js`. The local Turnstile widget, Resend key and sender must be configured for a real local email attempt. Use a Resend test key/domain only within its restrictions. `npm test` runs the endpoint tests with mocked provider responses; it never sends email.

## Build and tests

```sh
npm test
npm run build
npm run preview
```

The build command is `npm run build`; Vite writes the static site to `dist/`. Cloudflare Pages must use `dist` as its build output directory. The build includes Home, About, Services, Solutions, Careers, Contact, Privacy Policy and Terms of Use. The Pages Function source remains in the project-root `functions/` directory and is not copied into `dist`.

After confirming the production domain, build with its HTTPS origin to generate canonical URLs and `sitemap.xml`:

```sh
SITE_URL=https://your-verified-domain npm run build
```

Without `SITE_URL`, the build intentionally omits canonical URLs and the sitemap rather than publishing an invented address.

The About page keeps its nine portrait paths together in `js/team.js`. See [TEAM-IMAGE-PATHS.md](./TEAM-IMAGE-PATHS.md) for the exact folder and path values. Eight team-member names, roles and biographies remain anonymised until Aevum confirms approved public details.

## Contact enquiry delivery

The browser reads the public Turnstile site key from `GET /api/contact`, validates the form, obtains a Turnstile token and posts the enquiry to `POST /api/contact`. The Pages Function revalidates the fields, checks the same-origin request and Turnstile response, applies a per-isolate burst limit, and sends an escaped HTML and plain-text message through Resend. The recipient is fixed in the function as `aevumtechnologiesltd@gmail.com`; visitors cannot choose or change it. The visitor's validated email is the reply-to address. The form does not send an automatic visitor confirmation or marketing email, and the application does not store enquiries.

The per-isolate limit is a best-effort safeguard, not a distributed edge limit. Before launch, also add a Cloudflare WAF rate-limiting rule for `http.request.uri.path eq "/api/contact" and http.request.method eq "POST"`, keyed by source IP, with a threshold of 5 requests per 60 seconds and a 60-second block. Cloudflare applies its edge rule before requests reach the Function.

### Cloudflare Pages configuration

`wrangler.toml` sets the Functions-compatible Pages output directory to `./dist`. Its `name` must match the Pages project name; if you create the project with another name, update `name` before using Wrangler or deploying this configuration. The contact Function is discovered from the repository-root `functions/` directory.

For a Git-connected Pages project, configure:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** repository root
- **Runtime compatibility date:** `2026-11-12` (already set in `wrangler.toml`)
- **Environment:** add the following settings for both Production and Preview if both should accept enquiries.

| Setting | Cloudflare type | Value |
|---|---|---|
| `RESEND_API_KEY` | Secret | Resend API key; keep private |
| `CONTACT_FROM_EMAIL` | Variable | A sender address on a domain verified with Resend, e.g. a display name and that verified address |
| `TURNSTILE_SECRET_KEY` | Secret | Secret key for the Turnstile widget |
| `TURNSTILE_SITE_KEY` | Variable | Public site key for the same widget |

Set these in **Workers & Pages → your Pages project → Settings → Variables and Secrets**. Add the secrets with Cloudflare's secret type and redeploy after changes. The site key is public and is returned by `GET /api/contact`; the secret key and Resend key are only read by the server Function. Do not configure a recipient variable.

The endpoint also applies a bounded in-memory limit of five requests per source IP per minute within each running isolate. Configure the additional Cloudflare WAF rule described above for edge-wide protection; isolate memory is not shared across Cloudflare locations or restarts.

### Resend setup

1. Create/sign in to the Aevum Resend account and create an API key with the minimum permissions needed to send email.
2. Add a sending domain that Aevum owns and complete the DNS verification records Resend provides (including SPF/DKIM).
3. Configure `CONTACT_FROM_EMAIL` to use an address on that verified domain. Do not use the visitor's email as the sender.
4. Save the API key as the Cloudflare secret `RESEND_API_KEY`.
5. Submit a controlled live test and confirm the message arrives at `aevumtechnologiesltd@gmail.com`. A successful API response or local mock is not proof of inbox delivery.

The company recipient is a Gmail address; Resend may restrict test-domain delivery to the account owner. A verified sender domain and any account verification required by Resend must be completed before production delivery.

### Turnstile setup

1. In Cloudflare, create a Turnstile widget for the site and add every hostname that will serve the form (local development, Pages preview if used, and the eventual production hostname).
2. Add the widget's site key as `TURNSTILE_SITE_KEY` and its secret as the `TURNSTILE_SECRET_KEY` secret in each Pages environment.
3. The form loads Turnstile's official script and sends its short-lived token with the request. The Function validates the token, action and hostname with Cloudflare before sending email.

The security headers in `public/_headers` allow only the Turnstile script and frame origins in addition to the existing site policy.

## Domain and deployment

No domain is assumed or configured. Cloudflare Pages can first be deployed to the project-provided `*.pages.dev` hostname. For a custom domain:

1. Purchase a domain through a registrar (or use a domain Aevum already owns).
2. Add the domain to Cloudflare and complete the registrar nameserver/DNS verification Cloudflare requests.
3. In the Pages project, add the chosen custom hostname under **Custom domains** and follow the exact DNS records Cloudflare provides; do not guess a Pages CNAME target.
4. Add the same live hostname to the Turnstile widget. If using the domain for Resend sending, publish and verify the separate DNS records Resend provides.
5. Set `SITE_URL` to the verified HTTPS origin for canonical metadata, then rebuild and deploy.

For a Git deployment, connect the repository in **Workers & Pages → Create application → Pages → Connect to Git**, select the production branch, and enter the build command and output directory above. For a CLI deployment, install/authenticate Wrangler, create the Pages project with the same name as `wrangler.toml`, then run:

```sh
npm run build
npx wrangler pages deploy dist
```

Add the Production variables/secrets and WAF rule in the Cloudflare dashboard, then redeploy. Add Preview settings only if preview deployments should send real enquiries; otherwise use separate test credentials or do not enable email delivery in Preview.

## Contact details and legal documents

The Contact page and footer link to the provided email and both provided phone numbers. Social handles remain plain text because no official profile URLs are present in the project; no WhatsApp link has been added because no verified WhatsApp number was provided.

The privacy policy and terms of use pages are draft documents for founder review and legal approval. They must be updated/reviewed to accurately describe Turnstile, Resend, enquiry processing, retention and any applicable international data transfer before production launch. No automatic visitor confirmation or marketing email is sent.

## Theme and motion

The website follows the visitor's system color preference and reduced-motion preference. It does not store a separate theme preference. The home-page globe uses atmospheric motion and layered lighting designed to preserve the premium gold-and-black visual identity.

The source HTML pages can be served from the project root using VS Code Live Server after dependencies are installed. Vite remains the production bundler and writes deployable files to `dist/`.
