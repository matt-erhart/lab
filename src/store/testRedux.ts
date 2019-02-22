import { dispatch, getState } from "./createStore";
import { makePdfSegmentViewbox } from "./creators";
// console.log("init", getState());

const vb  = makePdfSegmentViewbox();
const vb2 = makePdfSegmentViewbox();

dispatch.app.addBatch({
  nodes: [vb, vb2],
});

// dispatch.app.updateData([
//   { nodeId: vb.id, data: { left: 10, top: 10 } as typeof vb.data }
// ]);



// dispatch.app.deleteNodes([vb.id])
// console.dir('empty', getState().app.nodes);

