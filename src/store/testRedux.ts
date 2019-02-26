import { dispatch, getState } from "./createStore";
import { makePdfSegmentViewbox } from "./creators";
import { NestedPartial } from "../renderer/utils";

// console.log("init", getState());

// const vbs = [...Array(500)].map(x => makePdfSegmentViewbox());
const vb = makePdfSegmentViewbox();
const vb2 = makePdfSegmentViewbox();

// dispatch.graph.addBatch({
//   nodes: vbs.slice(0, 2)
// });

dispatch.graph.addBatch({nodes: [vb]})

dispatch.graph.removeBatch({nodes: [vb.id]})

// const updates = vbs
//   .slice(0, 300)
//   .map(x => ({ id: x.id, data: { left: 3, top: 10 } }));
// console.time('time')

// const nodeUpdate = {
//   id: vbs[0].id,
//   data: {height: 1, }
// } 
// const nodeUpdate2 = {
//     id: vbs[1].id,
//     data: {height: 222, }
//   }
// dispatch.graph.updateBatch( {nodes: [nodeUpdate]});
// console.dir(getState().graph.nodes[vbs[1].id]);
// console.timeEnd('time')

// dispatch.app.deleteNodes([vb.id])
// console.dir(getState().app.nodes);
