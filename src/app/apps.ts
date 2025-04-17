import type { Component } from "vue";
import { createApp } from 'vue';
import * as PrimeVue from 'primevue';
import Aura from '@primeuix/themes/aura';
import { provideDBProvider } from './common/services/provider-db.ts';
import { provideActiveModel } from './common/services/provider-active-model.ts';

import ModelEditorApp from "./model-editor/model-editor.tsx";
import MeshLibraryApp from "./mesh-library/mesh-library-editor.tsx";
import GridMapApp from "./gridmap-viewer/gridmap-viewer.tsx";
import { provideGridMapProvider } from "./common/services/provider-gridmap.ts";

export { ModelEditorApp, MeshLibraryApp, GridMapApp };

export function startApp(App: Component) {
  const app = createApp(App);
  app.use(PrimeVue.Config, {
    theme: {
      preset: Aura
    }
  });
  provideDBProvider(app);
  provideActiveModel(app);
  provideGridMapProvider(app);
  app.mount("#app")
}