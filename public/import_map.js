const imports = {
  "three": "https://cdn.jsdelivr.net/npm/three@0.174.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/",
  "idb": "https://cdn.jsdelivr.net/npm/idb@v8.0.2/+esm",
  "three-mesh-bvh": "https://cdn.jsdelivr.net/npm/three-mesh-bvh@v0.9.0/+esm",
  "fflate": "https://cdn.jsdelivr.net/npm/fflate@v0.8.2/+esm",
  "js-md5": "https://cdn.jsdelivr.net/npm/js-md5@v0.8.3/+esm",
  "three/examples/jsm/Addons.js": "https://cdn.jsdelivr.net/npm/three@0.174.0/examples/jsm/Addons.js"
}

const importmap = document.createElement("script");
importmap.type = "importmap";
importmap.textContent = JSON.stringify({imports});
document.currentScript.after(importmap);