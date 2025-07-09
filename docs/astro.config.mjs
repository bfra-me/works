import starlight from '@astrojs/starlight'
// @ts-check
import {defineConfig} from 'astro/config'

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'bfra.me Works',
      social: [{icon: 'github', label: 'GitHub', href: 'https://github.com/bfra-me/works'}],
      sidebar: [
        {
          label: 'Guides',
          items: [
            // Each item here is one entry in the navigation menu.
            {label: 'Example Guide', slug: 'guides/example'},
          ],
        },
        {
          label: 'Reference',
          autogenerate: {directory: 'reference'},
        },
      ],
    }),
  ],
  site: 'https://docs.bfra.me',
  base: 'works',
  trailingSlash: 'always',
})
