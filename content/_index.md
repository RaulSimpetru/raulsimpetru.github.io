---
# Leave the homepage title empty to use the site title
title: ""
date: 2022-10-24
type: landing

design:
  # Default section spacing
  spacing: "1rem"

sections:
  - block: resume-biography-3
    content:
      # Choose a user profile to display (a folder name within `content/authors/`)
      username: admin
      text: ""
      # Show a call-to-action button under your biography? (optional)
      button:
        text: Download CV
        url: uploads/resume.pdf
    design:
      css_class: dark
  - block: collection
    id: papers
    content:
      title: Work Highlights
      filters:
        folders:
          - featured_works
        featured_only: true
    design:
      view: article-grid
      columns: 2
  - block: collection
    id: talks
    content:
      title: Where I Was (besides the lab)
      filters:
        folders:
          - event
    design:
      view: article-grid
      columns: 2
  - block: collection
    id: publications
    content:
      title: Publications
      text: ""
      filters:
        folders:
          - publication
        exclude_featured: false
    design:
      view: citation
---
