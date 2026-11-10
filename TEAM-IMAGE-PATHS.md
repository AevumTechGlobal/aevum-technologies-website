# Team image paths

The About page has one Founder portrait and eight numbered team-member portraits. The image paths are all kept together in [`js/team.js`](./js/team.js), in the `TEAM_IMAGE_PATHS` object. No HTML, CSS, or rendering logic needs to be changed to add the photos.

1. Copy the nine approved portrait files into `public/team/` (create the `team` folder if needed).
2. In `js/team.js`, replace each empty string in `TEAM_IMAGE_PATHS` with the matching site path:

| Profile | Suggested file | Value to enter |
|---|---|---|
| Founder | `public/team/founder.jpg` | `/team/founder.jpg` |
| Team member 01 | `public/team/team-member-01.jpg` | `/team/team-member-01.jpg` |
| Team member 02 | `public/team/team-member-02.jpg` | `/team/team-member-02.jpg` |
| Team member 03 | `public/team/team-member-03.jpg` | `/team/team-member-03.jpg` |
| Team member 04 | `public/team/team-member-04.jpg` | `/team/team-member-04.jpg` |
| Team member 05 | `public/team/team-member-05.jpg` | `/team/team-member-05.jpg` |
| Team member 06 | `public/team/team-member-06.jpg` | `/team/team-member-06.jpg` |
| Team member 07 | `public/team/team-member-07.jpg` | `/team/team-member-07.jpg` |
| Team member 08 | `public/team/team-member-08.jpg` | `/team/team-member-08.jpg` |

For example, change `founder: ''` to `founder: '/team/founder.jpg'`. The current shared portrait illustration remains in place until a path is supplied. The numbered team profiles intentionally do not invent names, roles, qualifications, or biographies; replace their displayed details only with information approved by Aevum.

Use square or portrait-oriented images with the subject centered. The page crops them to fit their portrait frames.
