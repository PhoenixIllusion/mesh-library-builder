import { defineComponent } from 'vue';
import ToolBoxMenu from '../common/toolbox/tool-box-menu-bar';
import ToolBox from '../common/toolbox/tool-box';

import '../app.scss';
import ActiveModel from './canvas/active-model';
import CollisionPanel from './collision/collision-panel';
import EditPositionOffset from './edit/edit-position-offset';
import Variants from './edit/variants/variants';

export default defineComponent({
  setup() {

  },
  render() {
    return <>
      <div class="header">Mesh Library Builder</div>
      <div class="main-content">
        <div class="left">
          <ActiveModel></ActiveModel>
        </div>
        <div class="right" style={{'min-width': '600px'}}>
          <CollisionPanel></CollisionPanel>
          <EditPositionOffset></EditPositionOffset>
          <Variants></Variants>
          <ToolBoxMenu></ToolBoxMenu>
          <ToolBox></ToolBox>
        </div>
      </div>
    </>
  }
})