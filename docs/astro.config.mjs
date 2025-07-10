import starlight from '@astrojs/starlight'
// @ts-check
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
  // site: 'https://docs.bfra.me',
  base: 'works',
  trailingSlash: 'always',
})
