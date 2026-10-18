# raulsimpetru.github.io

Personal site of Raul C. Sîmpetru: https://raulsimpetru.github.io/

- `bun run build` writes the site to `public/`. Content is in `site/data.mjs`, the page in `site/build.mjs`.
- Pushing to `master` builds and deploys it with GitHub Actions.
- `bun run figure` rebuilds the hero figure into `site/bench/`. It needs the anatomy kit and Blender with LimbKit, so it only runs locally; the built files are committed.
