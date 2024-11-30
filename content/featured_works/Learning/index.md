---
title: "Featured Article in IEEE TBME"
authors:
- admin
author_notes:
date: "2024-12-01T00:00:00Z"
doi: ""

share: false

# Schedule page publish date (NOT publication's date).
publishDate: "2017-01-01T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: [""]

# Publication name and optional abbreviated publication name.
publication: "IEEE Transactions on Biomedical Engineering"
publication_short: "IEEE TBME"

abstract: ''

# Summary. An optional shortened abstract.
summary: ''

tags:
featured: true

links:
- name: "Featured article"
  url: "https://www.embs.org/tbme/articles/learning-a-hand-model-from-dynamic-movements-using-high-density-emg-and-convolutional-neural-networks/"

# Featured image
# To use, add an image named `featured.jpg/png` to your page's folder. 
image:
  caption: ''
  focal_point: ""
  preview_only: false

# Associated Projects (optional).
#   Associate this publication with one or more of your projects.
#   Simply enter your project's folder or file name without extension.
#   E.g. `internal-project` references `content/project/internal-project/index.md`.
#   Otherwise, set `projects: []`.
projects: []

# Slides (optional).
#   Associate this publication with Markdown slides.
#   Simply enter your slide deck's filename without extension.
#   E.g. `slides: "example"` references `content/slides/example/index.md`.
#   Otherwise, set `slides: ""`.
slides: ''
---

Our study, which introduces a deep learning model that decodes forearm muscle activity into precise hand movements using full-bandwidth sEMG data from 320 sensors, was featured in IEEE Transactions on Biomedical Engineering (TBME).

Our results demonstrate that the model reliably predicts both movement and force output (kinematics and kinetics) across individual finger movements and compound actions. Through its ability to map muscle activity to specific hand functions, the model produces distinct neural patterns, or “neural embeddings,” for each unique movement. For instance, it differentiates between individual finger and multi-digit movements, even when performed at varying speeds. These neural embeddings consistently align with the anatomy of the hand, indicating that the model has effectively learned a representation of the hand’s biomechanical structure and adapts accordingly to complex movement patterns.

Unlike conventional methods that employ low-pass filtering of sEMG signals, our approach leverages the full-bandwidth EMG data, capturing a broader spectrum of signal information. This comprehensive approach allows for a more detailed and precise interpretation of the muscle signals underlying hand movements. These findings hold promise for the development of more responsive, intuitive assistive devices, potentially improving quality of life for users by providing a robust, user-adaptive control interface.