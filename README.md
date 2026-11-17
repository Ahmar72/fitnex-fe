# Fitnex — Animated Workout Website (React + Vite)

A fully animated, fully functional fitness website built on the `exercises-dataset-main` folder
(1,324 exercises + illustrations).

## Run it

```bash
cd "d:\New folder\gym-website"
npm install          # first time only
npm run dev          # opens http://localhost:5173
```

Production build:

```bash
npm run build        # output in dist/
npm run preview      # serve the built site locally
```

## Dataset

`npm run prepare-data` reads `../exercises-dataset-main` and writes:

- `public/data/exercises.json` — slim list (id, name, body part, equipment, target, muscles, image, English steps)
- `public/data/steps/<id>.json` — instructions in 10 languages (loaded on the exercise page)
- `public/images/*.jpg` — the 1,324 illustrations

This has already been run. Run it again only if the dataset changes.

## Pages

| Route | What it does |
| --- | --- |
| `/` | Landing page: preloader, animated hero with a live phone mockup, marquee bands, counters, bento features (interactive plate calculator, rest timer, progress chart, heatmap), body-part explorer, horizontal-scroll showcase, programmes, steps, FAQ, CTA |
| `/exercises` | Library: search (press `/`), filters by body part / equipment / muscle, sort, favourites, infinite scroll. Filters are kept in the URL |
| `/exercises/:id` | Exercise detail: big illustration, specs, steps in 10 languages, muscles, related exercises, prev/next |
| `/builder` | Workout builder: sets/reps/kg editor, reorder, quick add, summary + muscle split, **live workout mode** with auto rest timer, finish & log, training heatmap |

Favourites, the current workout and the training log are saved in `localStorage`.

## Tech

React 18, React Router 6, Framer Motion (page transitions, scroll/reveal/layout animations),
Lenis (smooth scrolling). All styling is in `src/index.css`.

## Credits

Exercise illustrations © Gym visual — https://gymvisual.com/ (credited in the footer).
