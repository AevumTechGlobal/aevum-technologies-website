# Team image paths

The About page has one Founder portrait and eight numbered team-member portraits. Their root-relative paths are maintained together in [`js/team.js`](./js/team.js), in the `TEAM_IMAGE_PATHS` object. The files are served from `public/images/` and copied to `dist/images/` by Vite.

| Profile | File in `public/images/` | Path used by the site |
|---|---|---|
| Founder | `WhatsApp Image 2026-11-10 at 4.09.44 PM.jpeg` | `/images/WhatsApp Image 2026-11-10 at 4.09.44 PM.jpeg` |
| Team member 01 | `WhatsApp Image 2026-11-10 at 4.13.01 PM (1).jpeg` | `/images/WhatsApp Image 2026-11-10 at 4.13.01 PM (1).jpeg` |
| Team member 02 | `WhatsApp Image 2026-11-06 at 1.54.38 PM.jpeg` | `/images/WhatsApp Image 2026-11-06 at 1.54.38 PM.jpeg` |
| Team member 03 | `WhatsApp Image 2026-11-06 at 6.24.34 PM.jpeg` | `/images/WhatsApp Image 2026-11-06 at 6.24.34 PM.jpeg` |
| Team member 04 | `WhatsApp Image 2026-11-06 at 7.05.08 PM.jpeg` | `/images/WhatsApp Image 2026-11-06 at 7.05.08 PM.jpeg` |
| Team member 05 | `WhatsApp Image 2026-11-06 at 7.12.14 PM.jpeg` | `/images/WhatsApp Image 2026-11-06 at 7.12.14 PM.jpeg` |
| Team member 06 | `WhatsApp Image 2026-11-06 at 12.42.42 PM.jpeg` | `/images/WhatsApp Image 2026-11-06 at 12.42.42 PM.jpeg` |
| Team member 07 | `WhatsApp Image 2026-11-10 at 4.12.46 PM.jpeg` | `/images/WhatsApp Image 2026-11-10 at 4.12.46 PM.jpeg` |
| Team member 08 | `WhatsApp Image 2026-11-07 at 2.44.05 PM.jpeg` | `/images/WhatsApp Image 2026-11-07 at 2.44.05 PM.jpeg` |

The shared profile placeholder is `/images/team-profile-placeholder.svg`. Keep the actual filenames, including spaces and punctuation, unchanged when replacing or adding portraits. The page crops images to fit its existing portrait frames.
