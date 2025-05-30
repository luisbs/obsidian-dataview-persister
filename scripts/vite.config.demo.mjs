import { resolve } from 'path'
import { defineConfig } from 'vite'
import { packageBanner, packageStatic, rollupOptions } from './vite.share.mjs'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [packageBanner(), packageStatic(['manifest.json', 'styles.css'])],
    resolve: { alias: { '@': resolve(__dirname, '../src') } },
    build: {
        emptyOutDir: false,
        outDir: 'test-vault/.obsidian/plugins/dataview-persister',
        target: 'es2022',
        sourcemap: 'inline',
        rollupOptions: rollupOptions(),
        lib: {
            formats: ['cjs'],
            fileName: () => 'main.js',
            entry: resolve(__dirname, '../src/main.ts'),
        },
    },
})
