import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En développement, Vite joue le rôle du nginx de l'image Docker : il relaie
// /api vers KitchenOwl en ajoutant le jeton permanent. Le navigateur ne voit
// jamais le jeton. Lancer avec KITCHENOWL_URL et KITCHENOWL_TOKEN.
const target = process.env.KITCHENOWL_URL ?? 'http://127.0.0.1:18083'
const token = process.env.KITCHENOWL_TOKEN ?? ''

export default defineConfig({
  plugins: [
    react(),
    {
      // Comme docker/default.conf.template : la gestion des jetons reste fermée.
      name: 'block-auth',
      configureServer(server) {
        server.middlewares.use('/api/auth', (_req, res) => {
          res.statusCode = 403
          res.end()
        })
      },
    },
  ],
  server: {
    proxy: {
      '/api': { target, changeOrigin: true, headers: { Authorization: `Bearer ${token}` } },
      '/traduction': {
        target: process.env.TRANSLATE_URL ?? 'http://127.0.0.1:18095',
        changeOrigin: true,
        rewrite: (p: string) => p.replace(/^\/traduction/, ''),
      },
    },
  },
})
