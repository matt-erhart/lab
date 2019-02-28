// todo delete
// import { withUid } from "./utils";
// import Graph from "graphology";
// import connectedCaveman from "graphology-generators/community/connected-caveman";
// import subGraph from "graphology-utils/subgraph";
// import { flatten, unique } from "./utils";
// import { all } from "q";

// mount -> filter all and 1st
// itemsAdded
// itemsRemoved
// itemsUpdated
// change filter

// cool for perf
// let t = [];
// let c = 0;
// for (let i in Array(10000).keys()) {
//   const time = Date.now();
//   t.push({ timeCreated: time, timeUpdated: time, version: c++ });
// }

// const graph = connectedCaveman(Graph, 40, 40);
// let nodes = {};
// let edges = {};
// let count = 0;
// // graph.forEachNode((node, attributes) => {
// //   console.log(node, attributes)
// //   nodes[] = ({ key: node.key, attributes: { a: count++ } });
// // });
// console.time("%%");

// // let obj = {}
// // let arr = []
// let nodeMap = new Map()
// graph.forEachNode((node, attributes) => {
//   // obj[node] = ({ key: node, attributes: { a: count++ } });
//   // arr.push({ key: node, attributes: { a: count++ } });
//   nodeMap.set(node, { key: node, attributes: { a: count++ } });
// });
// // let obj = {};
// // let arr = [];
// // let keys = [];
// let edgeMap = new Map()
// graph.forEachEdge(
//   (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
//     // arr.push({ key: count, source, target, attributes: { a: count } });
//     // obj[count] = { key: count, source, target, attributes: { a: count } };
//     // keys.push(count);
//     edgeMap.set(count, { key: count, source, target, attributes: { a: count } })
//     count++;
//   }
// );
// console.log(arr)

/**
 * PUSH PERF
 * push obj to array 3mil/sec
 * obj[key] = someobj 1.5mil/sec
 * {...obj, newobj} 65k/sec
 *
 * GET 1
 * obj[key] 87mil/sec
 * arr[findix] 1.8mil/sec
 * 
 * get scan vs obj.key
 * scan arr of strings 1.6mil/sec
 * scan arr of objs with strings 466k/sec
 *
 * new Map for of 2300sec (give back a map)
 * arr.filter 2500/sec
 * Object.values(obj).filter 2000/sec
 * for in filter obj 300/sec (push/mut obj about the same)
 *
 */
// console.log(Object.values(obj).filter(x => x.source === '99'));
// console.log(edgeMap.values)

// import Benchmark from "benchmark";
// var suite = new Benchmark.Suite();
// var options = {
//   maxTime: 0.5
// };
// // add tests
// suite.add(
//   "map",
//   function() {
//     // let x = arr.filter(x => x.source === '99')

//     let subNodes = new Map();
//     let subEdges = new Map();
//     for (let edge of edgeMap.values()){
//       if (edge.source === '99') {
//         subEdges.set(edge.key, edge)
//       }
//     }
//     for (let se of subEdges.values()){
//       if (edge.source === '99') {
//         subEdges.set(edge.key, edge)
//       }
//     }


//   },
//   options
// )
//   .on(
//     "cycle",
//     function(event) {
//       console.log(String(event.target));
//     },
//     options
//   )
//   .on(
//     "complete",
//     function() {
//       console.log("Fastest is " + this.filter("fastest").map("name"));
//     },
//     options
//   )
//   // run async
//   .run({ async: true });

//////////////////

// console.timeEnd('%%')

// graph.forEachEdge(
//   (edge, attributes, source, target, sourceAttributes, targetAttributes) => {
//     edges.push({ key: count++, source, target, attributes: { a: count++ } });
//   }
// );

// let nodes_obj = nodes.reduce((all, n, ix) => {
//   return {...all, [n.key]: n}
// }, {})

// let edge_obj = edges.reduce((all, n, ix) => {
//   return {...all, [n.key]: n}
// }, {})
// // console.log(edge_obj)

// for (let i in [1,2,3,4,5,6,7]) {
//   console.time("%%%");
//   let e = []
//   for (let i in edge_obj) {
//     let edge = edge_obj[i]
//     // console.log(edge)
//     if (edge.source === '0' && edge.target === '0')
//     e.push(edge)
//   }
// const e = edge_obj.keys().filter(e => edge_obj[e].source === "0" || edge_obj[e].target === '0');
// let all = {}
// for (let edge of e ) {
//   if (!all.hasOwnProperty(edge.source))
//   all[edge.source] = nodes_obj[edge.source]
//   if (!all.hasOwnProperty(edge.target))
//   all[edge.target] = nodes_obj[ edge.target]
// }
// console.timeEnd("%%%");

// }
// console.log(nodes.length, edges.length)

// const sub = e.reduce((all, edge,ix) => ({...all, [edge.source]: {}, [edge.target]: {}}) , {})
// const sub = e.reduce((all, edge, ix) => {
//   all.push(edge.source, edge.target);
//   return all;
// }, []);
// let e = []
// for (let edge of edges){
//   if (edge.source === '0'){
//     e.push(edge)
//   }
// }

// console.timeEnd('%%%')

// console.time('%%%')
// // const graph2 = graph.copy() // 8ms per 1k nodes
// // console.log(graph === graph2)

// const n1 = graph.neighbors('2');
// const n2 = unique(flatten<string>(n1.map(n => graph.neighbors(n))))
// const n3 = unique(flatten<string>(n2.map(n => graph.neighbors(n))))
// // console.log(n1.length, n2.length, n3.length)
// // console.log(n1.length, n2.length, n3.length)
// const sg = subGraph(graph, n1)
// // console.log(subGraph(graph, n1))

// console.timeEnd('%%%') // 5.780ms
// console.log(n1.length,  sg.order, sg.size, graph.order)
