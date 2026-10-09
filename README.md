# SiteScanner

SiteScanner is a single-page architectural judgement tool designed for students and practitioners analysing a site photograph or building in a way that encourages judgement rather than passive description.

## What it does

- Lets you upload multiple site images and compare them in the same analysis framework.
- Shows a visual board with annotation pins that can be added directly on the image.
- Provides a transparent weighted judgement matrix with editable scores and weights.
- Lets the user decide what to retain, adapt, reuse, replace, or build new.
- Tracks reusable materials and keeps the analysis grounded in the actual image.
- Encourages a more architectural approach by valuing social and economic usefulness, not only architectural quality.

## How to use it

1. Open `index.html` in a browser, or run a local static server:
   - `python -m http.server 8000`
   - then visit http://localhost:8000
2. Click “Add image” to upload one or more photos.
3. Use the sliders to adjust the value and weight of each criterion.
4. Click image pins to add quick observations.
5. Toggle decision chips and add material tags to test what should remain, adapt, reuse, replace, or be newly built.
6. Write your own reasoning in the notes area.

## Customisation ideas

- Change the default scoring categories in `script.js`.
- Adjust the board palette and typography in `styles.css`.
- Replace the default site illustration with your own image set.
- Add more annotation prompt logic or a more advanced drawing overlay.

## Design intent

This is intentionally not a generic site-description generator. It is built to make the user think in architectural terms:

- What is useful?
- What is worth keeping?
- What is adaptable?
- What should be reused?
- What genuinely needs to be new?

This first version is a strong foundation for a more advanced site-analysis tool later.

