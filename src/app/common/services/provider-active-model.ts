import { App, inject, Ref, ref } from "vue";

interface ActiveModel {
  activeModel: Ref<string | null>
}

function createActiveModel(): ActiveModel {
  return {
    activeModel: ref<string | null>(null)
  }
}


const __symb = Symbol('ActiveModel');
export function provideActiveModel(app: App<Element>) {
  app.provide(__symb, createActiveModel())
}

export function injectActiveModel() {
  return inject<ActiveModel>(__symb)
}