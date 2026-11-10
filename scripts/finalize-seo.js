import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const configuredUrl = process.env.SITE_URL;
const pageFiles = [
  ['index.html', '/'],
  ['about.html', '/about.html'],
  ['services.html', '/services.html'],
  ['solutions.html', '/solutions.html'],
  ['careers.html', '/careers.html'],
  ['contact.html', '/contact.html'],
  ['privacy-policy.html', '/privacy-policy.html'],
  ['terms-of-use.html', '/terms-of-use.html'],
];

const distRoot = resolve('dist');
const assetFiles = await readdir(resolve(distRoot, 'assets'));
const emblemAsset = assetFiles.find((file) => /^aevum-emblem-gold-[\w-]+\.png$/.test(file));
if (!emblemAsset) throw new Error('The built Aevum emblem image could not be found.');

let origin;
if (configuredUrl) {
  let site;
  try {
    site = new URL(configuredUrl);
  } catch {
    throw new Error('SITE_URL must be a valid absolute HTTPS URL.');
  }

  if (site.protocol !== 'https:' || site.pathname !== '/' || site.username || site.password || site.search || site.hash) {
    throw new Error('SITE_URL must be an HTTPS origin without a path, credentials, query, or fragment.');
  }
  origin = site.origin;
}

const entries = [];
for (const [file, path] of pageFiles) {
  const filePath = resolve(distRoot, file);
  const html = await readFile(filePath, 'utf8');
  const url = origin ? new URL(path, `${origin}/`).href : null;
  const imagePath = `/assets/${emblemAsset}`;
  const imageUrl = origin ? new URL(imagePath, `${origin}/`).href : imagePath;
  if (!html.includes('property="og:image"')) {
    throw new Error(`Open Graph image metadata is missing from ${file}.`);
  }
  const withSocialImage = html.replace(
    /(<meta property="og:image" content=")[^"]*(" \/>)/,
    `$1${imageUrl}$2`,
  );
  const socialUrls = origin
    ? `    <link rel="canonical" href="${url}" />\n    <meta property="og:url" content="${url}" />\n`
    : '';
  const updated = withSocialImage.replace('</head>', `${socialUrls}  </head>`);
  if (updated === html) throw new Error(`Could not update social metadata for ${file}.`);
  await writeFile(filePath, updated);
  if (url) entries.push(`  <url>\n    <loc>${url}</loc>\n  </url>`);
}

if (!origin) {
  console.warn('SITE_URL is not set; sitemap and canonical URLs were not generated.');
  process.exit(0);
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;
await writeFile(resolve(distRoot, 'sitemap.xml'), sitemap);

try {
  const robotsPath = resolve(distRoot, 'robots.txt');
  const robots = await readFile(robotsPath, 'utf8');
  await writeFile(robotsPath, `${robots.trimEnd()}\nSitemap: ${origin}/sitemap.xml\n`);
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

console.log(`Generated canonical URLs and sitemap for ${origin}.`);
