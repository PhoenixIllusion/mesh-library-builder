import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'vite'
import importMap from './src/imports';
import externalGlobals from "rollup-plugin-external-globals";

export default defineConfig({
	// takes no effect
	build: {
		rollupOptions: {
      input: ['gridmap-viewer.html','mesh-library-editor.html','model-editor.html'],
			external: [... Object.keys(importMap),
        'vue', '@vueuse/core' ,'primevue','@primeuix/themes/aura','@primevue/core'],
      plugins: [
        externalGlobals({
          'vue': 'Vue',
          'primevue': 'PrimeVue',
          '@primevue/core': 'PrimeVue',
          '@primeuix/themes/aura': 'PrimeUIX.Themes.Aura',
          '@vueuse/core': 'VueUse'
        })
      ]
    }
  },
  plugins: [vue(),vueJsx()],
})