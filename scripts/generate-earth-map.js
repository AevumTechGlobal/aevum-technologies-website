import { writeFile } from 'node:fs/promises';
import { geoEquirectangular, geoGraticule10, geoPath } from 'd3-geo';
import { merge, mesh } from 'topojson-client';
import { optimize } from 'svgo';
import countriesTopology from 'world-atlas/countries-50m.json' with { type: 'json' };

const width = 2048;
const height = 1024;
const projection = geoEquirectangular()
  .scale(width / (2 * Math.PI))
  .translate([width / 2, height / 2]);
const path = geoPath(projection).digits(1);
const geometries = countriesTopology.objects.countries.geometries;
const land = merge(countriesTopology, geometries);
const borders = mesh(
  countriesTopology,
  countriesTopology.objects.countries,
  (first, second) => first !== second,
);
const coastline = path(land);
const countryLines = path(borders);
const graticule = path(geoGraticule10());

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <metadata>Coastline and country outlines derived from Natural Earth 1:50m data, public domain.</metadata>
  <defs>
    <linearGradient id="ocean" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#17212a"/>
      <stop offset=".48" stop-color="#080d12"/>
      <stop offset="1" stop-color="#12140f"/>
    </linearGradient>
    <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#494b45"/>
      <stop offset=".44" stop-color="#343936"/>
      <stop offset="1" stop-color="#55503f"/>
    </linearGradient>
    <pattern id="terrain" width="38" height="28" patternUnits="userSpaceOnUse">
      <path d="M-5 21 Q6 7 19 14 T44 6 M-7 29 Q8 14 22 22 T43 14" fill="none" stroke="#d4b674" stroke-opacity=".09" stroke-width=".7"/>
      <circle cx="8" cy="5" r=".8" fill="#eed08c" fill-opacity=".12"/>
      <circle cx="31" cy="24" r=".65" fill="#c4d0c8" fill-opacity=".11"/>
    </pattern>
    <radialGradient id="surfaceShade">
      <stop offset=".18" stop-color="#fff" stop-opacity=".08"/>
      <stop offset="1" stop-color="#000" stop-opacity=".18"/>
    </radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#ocean)"/>
  <path d="${graticule}" fill="none" stroke="#aab5b4" stroke-opacity=".1" stroke-width="1.1"/>
  <path d="${coastline}" fill="url(#land)" stroke="#d7ad60" stroke-opacity=".54" stroke-width="1.8"/>
  <path d="${coastline}" fill="url(#terrain)" opacity=".8"/>
  <path d="${countryLines}" fill="none" stroke="#dfbd79" stroke-opacity=".26" stroke-width="1.15"/>
  <rect width="${width}" height="${height}" fill="url(#surfaceShade)"/>
</svg>`;

const optimized = optimize(svg, {
  multipass: true,
  plugins: ['preset-default'],
});

await writeFile(new URL('../assets/images/earth-map.svg', import.meta.url), optimized.data);
console.log(`Generated ${width} × ${height} Natural Earth map texture.`);
