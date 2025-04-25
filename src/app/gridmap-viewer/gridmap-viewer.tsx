import { defineComponent } from 'vue';
import '../app.scss';
import GridmapMenu from './gridmap/gridmap-menu';
import GridmapList from './gridmap/gridmap-list';
import GridmapViewer from './canvas/gridmap-viewer';
import { Checkbox } from 'primevue';
import { makeVisibility } from '../common/dialog/visibility';

export default defineComponent({
  setup() {
    const collision = makeVisibility();
    return { collision: collision.ref, showCollide: collision.show, hideCollide: collision.hide }
  },
  render() {
    return <>
      <div class="header">Mesh Library Builder</div>
      <div class="main-content">
        <div class="left">
          <GridmapViewer showCollision={this.collision}></GridmapViewer>
        </div>
        <div class="right">
          <GridmapMenu></GridmapMenu>
          <GridmapList></GridmapList>
          <div>
            <Checkbox binary={true} modelValue={this.collision} onUpdate:modelValue={(b: boolean) => b ? this.showCollide() : this.hideCollide()}></Checkbox>
            <label>Show Collision</label>
          </div>
        </div>
      </div>
    </>
  }
})