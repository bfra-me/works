// @ts-check
import starlight from '@astrojs/starlight'
import {defineConfig} from 'astro/config'

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'bfra.me Works',
      description: 'Tools and components for modern ES development',
      social: [{icon: 'github', label: 'GitHub', href: 'https://github.com/bfra-me/works'}],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            {label: 'Introduction', slug: 'getting-started/introduction'},
            {label: 'Installation', slug: 'getting-started/installation'},
            {label: 'Quick Start', slug: 'getting-started/quick-start'},
          ],
        },
        {
          label: 'Packages',
          items: [
            {label: 'create', slug: 'packages/create'},
            {label: 'es', slug: 'packages/es'},
            {label: 'eslint-config', slug: 'packages/eslint-config'},
            {label: 'prettier-config', slug: 'packages/prettier-config'},
            {label: 'semantic-release', slug: 'packages/semantic-release'},
            {label: 'tsconfig', slug: 'packages/tsconfig'},
          ],
        },
        {
          label: 'Guides',
          items: [
            {label: 'Setting up a New Project', slug: 'guides/new-project'},
            {label: 'Configuration Best Practices', slug: 'guides/configuration'},
            {label: 'Contributing', slug: 'guides/contributing'},
          ],
        },
        {
          label: 'Reference',
          autogenerate: {directory: 'reference'},
        },
      ],
    }),
  ],
  base: 'works',
  trailingSlash: 'always',
  // Workaround for Zod v4 compatibility: prevent Vite from externalizing zod
  // so Astro uses its bundled Zod v3 instead of the project's Zod v4
  // See: https://github.com/withastro/astro/issues/14117
  vite: {
    ssr: {
      noExternal: ['zod'],
    },
  },
})
