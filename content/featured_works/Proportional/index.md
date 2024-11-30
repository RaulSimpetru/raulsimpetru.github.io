---
title: "My First Real-Time EMG Decoding of Over 20 Degrees of Freedom in the Human Hand"
authors:
- admin
author_notes:
date: "2023-07-13T00:00:00Z"
doi: ""

share: false

# Schedule page publish date (NOT publication's date).
publishDate: "2017-01-01T00:00:00Z"

# Publication type.
# Accepts a single type but formatted as a YAML list (for Hugo requirements).
# Enter a publication type from the CSL standard.
publication_types: [""]

# Publication name and optional abbreviated publication name.
publication: "IEEE Transactions on Neural Systems and Rehabilitation Engineering"
publication_short: "IEEE TNSRE"

abstract: ''

# Summary. An optional shortened abstract.
summary: ''

tags:
featured: true

# links:
# - name: ""
#   url: ""
url_pdf: https://ieeexplore.ieee.org/document/10182328
url_video: 'https://www.youtube.com/watch?v=8tjoi3-rZU0&list=PLkpLOrBUAGCFQtzjLwz4_Yisga19Kt4uJ'

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

Surface electromyography (sEMG) is a non-invasive technique that measures electrical activity in muscles, making it valuable for prosthetics and assistive systems. However, current sEMG-based decoding algorithms are limited in the number of degrees of freedom they can simultaneously and proportionally control in real-time. This limitation restricts their utility in applications like advanced prosthetics and human-machine interfaces.

In this study, we present a deep learning method that decodes forearm muscle activity into proportional and simultaneous control of over 20 degrees of freedom of the human hand with real-time resolution and latency below 50 ms, matching neuromuscular delays. Using high-density sEMG data and hand kinematics recorded during various movements (grasping, pinching, digit-specific motions, and gestures) at different speeds, our neural network achieved real-time kinematic predictions at 32 updates per second. Employing transfer learning and a prediction smoothing algorithm, we reconstructed the full 3D geometry of the hand in real-time.

Our results demonstrate that high-density sEMG signals contain sufficient information to predict full hand kinematics, offering immediate potential for applications in individuals with motor impairments. This method represents a significant advance in decoding muscle activity for precise, real-time hand control.
