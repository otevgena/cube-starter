import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// В dev проксируем запросы к API на боевой backend, чтобы они были SAME-ORIGIN
// для браузера (localhost:5173): тогда работают httpOnly-куки сессии и CORS,
// без cross-site блокировок. cookieDomainRewrite переписывает домен куки на
// localhost, чтобы браузер её сохранил и слал обратно (Vite вернёт её на api).
const API_TARGET = 'https://api.cube-tech.ru'
// cookieDomainRewrite:'' убирает Domain=.cube-tech.ru у Set-Cookie → кука становится
// host-only для localhost, браузер её сохраняет и шлёт обратно (Vite вернёт её на api).
// bypass: пути со статическим расширением (/profile/profile.png, /projects/*.jpg,
// /objects/...svg) отдаём ЛОКАЛЬНО, а не на API — иначе картинки под этими
// префиксами ломались. На API уходят только запросы без расширения (/objects, /auth/me…).
const prox = {
  target: API_TARGET, changeOrigin: true, secure: true, cookieDomainRewrite: '',
  bypass(req) { const p = String(req.url || '').split('?')[0]; if (/\.[a-zA-Z0-9]+$/.test(p)) return req.url; },
}
const API_PATHS = ['/auth', '/profile', '/admin', '/objects', '/projects', '/files', '/documents', '/assistant', '/orgs', '/counterparties', '/health']

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: Object.fromEntries(API_PATHS.map((p) => [p, prox])),
  },
})
