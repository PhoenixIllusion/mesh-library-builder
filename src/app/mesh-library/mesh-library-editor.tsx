import { defineComponent } from 'vue';
import GridCanvas from './canvas/grid-canvas';

import MapMenu from './grid/map-menu-bar';
import MapGrid from './grid/map-grid';
import ToolBoxMenu from '../common/toolbox/tool-box-menu-bar';
import ToolBox from '../common/toolbox/tool-box';

import '../app.scss';

export default defineComponent({
  setup() {

  },
  render() {
    return <>
      <div class="header">Mesh Library Builder</div>
      <div class="main-content">
        <div class="left">
          <GridCanvas></GridCanvas>
        </div>
        <div class="right">
          <MapMenu></MapMenu>
          <MapGrid></MapGrid>
          <ToolBoxMenu></ToolBoxMenu>
          <ToolBox></ToolBox>
        </div>
      </div>
    </>
  }
})