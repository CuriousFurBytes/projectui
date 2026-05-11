import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ProjecTUI',
  description: 'Visual editor for terminal user interfaces. Export to Python (Textual), Go (Bubble Tea), and Rust (Ratatui).',
  base: '/docs/',
  outDir: '../dist/docs',
  cleanUrls: true,

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap', rel: 'stylesheet' }],
  ],

  themeConfig: {
    siteTitle: '▶ ProjecTUI',

    nav: [
      { text: 'Getting Started', link: '/introduction/getting-started' },
      { text: 'Components', link: '/reference/component-reference' },
      { text: 'GitHub', link: 'https://github.com/lucasqueiroz/projectui' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/lucasqueiroz/projectui' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        collapsed: false,
        items: [
          { text: 'Getting Started', link: '/introduction/getting-started' },
          { text: 'Screenshots', link: '/introduction/screenshots' },
          { text: 'AI Disclaimer', link: '/introduction/ai-disclaimer' },
        ],
      },
      {
        text: 'Usage',
        collapsed: false,
        items: [
          { text: 'The Canvas', link: '/usage/canvas' },
          { text: 'Components', link: '/usage/components' },
          { text: 'Properties Panel', link: '/usage/properties' },
          { text: 'Layers & Screens', link: '/usage/layers' },
          { text: 'Timeline', link: '/usage/timeline' },
          { text: 'Exporting Code', link: '/usage/exporting' },
          { text: 'Sharing Projects', link: '/usage/sharing' },
          { text: 'Keyboard Shortcuts', link: '/usage/shortcuts' },
        ],
      },
      {
        text: 'Export Targets',
        collapsed: false,
        items: [
          { text: 'Python · Textual', link: '/export-targets/python' },
          { text: 'Go · Bubble Tea', link: '/export-targets/go' },
          { text: 'Rust · Ratatui', link: '/export-targets/rust' },
        ],
      },
      {
        text: 'Reference',
        collapsed: false,
        items: [
          { text: 'Component Reference', link: '/reference/component-reference' },
          { text: 'Project File Format', link: '/reference/project-format' },
          { text: 'Libraries & Frameworks', link: '/reference/libraries' },
          { text: 'Similar Projects', link: '/reference/inspiration' },
        ],
      },
      {
        text: 'Meta',
        collapsed: true,
        items: [
          { text: 'Deployment', link: '/meta/deployment' },
          { text: 'Contributing', link: '/meta/contributing' },
          { text: 'License', link: '/meta/license' },
        ],
      },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024–2026 Lucas Queiroz',
    },

    editLink: {
      pattern: 'https://github.com/lucasqueiroz/projectui/edit/main/docs-src/:path',
      text: 'Edit this page on GitHub',
    },

    outline: {
      level: [2, 3],
    },
  },
})
