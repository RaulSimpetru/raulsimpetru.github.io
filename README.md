# raulsimpetru.github.io

Personal site of Raul C. Sîmpetru: https://raulsimpetru.github.io/

- `bun run build` writes the site to `public/`. Content is in `site/data.mjs`, the page in `site/build.mjs`.
- Pushing to `master` builds and deploys it with GitHub Actions.
- The scenes in `site/img/` (`desert-hero`, `research-landmarks`, `workshop`, `amphitheatre`, `dusk-camp`) are clean-line comic illustrations generated with FLUX 3 Image Klein on the lab workstation. Codex drew Raul's figure on the dune ridge in `desert-hero.webp` from a back-view photo. `amphitheatre-screen-mask.png` marks the stone screen where the talk photos are shown.
- The hero, `site/img/lab-demo.webp`, is Raul's photo of a live demo in the lab (`lab-demo-photo.jpg`) redrawn in the same style with OpenAI Codex (gpt-6-astra); `hand-zoom.webp` is the hand close-up drawn the same way. `art/` keeps the full-size PNG originals, a version with the desert in the windows and the hand in its photo pose, and the exact prompts (`art/prompts.json`); it is not part of the deployed site.
