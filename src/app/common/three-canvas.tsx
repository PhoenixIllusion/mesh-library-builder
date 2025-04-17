

import { defineComponent, shallowRef } from "vue";

import './threejs-canvas.scss';
import { AmbientLight, Camera, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export function createScene() {
  const scene = shallowRef<Scene | null>(null);
  function setScene(s: Scene | null) {
    scene.value = s;
  }
  return { scene, setScene }
}
export function createCamera() {
  const camera = shallowRef<Camera | null>(null);
  function setCamera(s: Camera | null) {
    camera.value = s;
  }
  return { camera, setCamera }
}

export default defineComponent({
  props: {
    initialZoom: Number,
  },
  emits: {
    "scene": (_: Scene) => true,
    "camera": (_: Camera) => true,
    "renderer": (_: WebGLRenderer) => true
  },
  mounted() {
    setTimeout(() => {
      const canvas = this.$el;
      canvas.width = (canvas.parentElement?.clientWidth || 640);
      canvas.height = (canvas.parentElement?.clientHeight || 640);
      const scene = new Scene();
      const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new WebGLRenderer({ canvas, powerPreference: 'low-power', antialias: true });
      renderer.setSize(canvas.width, canvas.height, false);
      const controls = new OrbitControls(camera, renderer.domElement);
      const directionalLight = new DirectionalLight(0xffffff, 0.5);
      const ambientLight = new AmbientLight(0xffffff, 0.5);
      scene.add(directionalLight, ambientLight);

      camera.position.z = -1 * (this.initialZoom || 20);
      camera.position.y = camera.position.z / -2;
      controls.update();
      const animate = () => {
        renderer.render(scene, camera);
        controls.update();
      }
      renderer.setAnimationLoop(animate);
      this.$emit('scene', scene)
      this.$emit('camera', camera)
      this.$emit('renderer', renderer)
    }, 100);
  },
  render() {
    return <canvas class="threejs-canvas"></canvas>
  }
});