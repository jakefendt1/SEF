import { defineConfig, minimalPreset } from '@vite-pwa/assets-generator/config'

// The icon is a full-bleed red square, so the iPhone/iPad and maskable
// (Android) icons need no white padding around it.
export default defineConfig({
  preset: {
    ...minimalPreset,
    maskable: { ...minimalPreset.maskable, padding: 0, resizeOptions: { background: '#EA1C24' } },
    apple: { ...minimalPreset.apple, padding: 0, resizeOptions: { background: '#EA1C24' } },
  },
  images: ['public/icon.svg'],
})
