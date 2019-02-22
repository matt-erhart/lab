import { dispatch, getState } from "./createStore";
import { makePdfSegmentViewbox } from "./creators";
// console.log("init", getState());

const vbs = [...Array(500)].map(x => makePdfSegmentViewbox())
const vb  = makePdfSegmentViewbox();
const vb2 = makePdfSegmentViewbox();
console.log(getState())

dispatch.graph.addBatch({
  nodes: vbs.slice(0,2),
});
// console.log(getState())

// const updates = vbs.slice(0,300).map(x => ({id: x.id, data: {left: 3, top: 10}}))
// console.time('time')

// dispatch.app.updateData(
//     {nodes: updates}
// );

// console.timeEnd('time')

// dispatch.app.deleteNodes([vb.id])
// console.dir(getState().app.nodes);

