// import * as React from "react";
// import konva, { Circle, Stage, CircleConfig, LineConfig } from "konva";
// // import { interval } from "rxjs";
// import styled from "styled-components";
// import Konva from "konva";
// import store, { iRootState, iDispatch } from "../store/createStore";
// import {
//   makePdfSegmentViewbox,
//   Nodes,
//   Links,
//   aNode,
//   aLink,
//   makeLink,
//   NodeDataTypes,
//   makeUserMediaText
// } from "../store/creators";
// import { connect } from "react-redux";
// import { DeepPartial } from "redux";
// import PopupPortal from "./PopupPortal";
// import { Portal } from "./Portal";
// import PdfViewer from "./PdfViewer";
// import { Tooltip } from "./Tooltip";
// import { oc } from "ts-optchain";
// import produce from "immer";
// import { Formik } from "formik";

// const ScrollContainer = styled.div`
//   min-width: calc(50vw - 22px);
//   overflow: auto;
//   margin: 10;
//   border: 1px solid grey;
//   flex: 1;
// `;

// const AppDefaults = {
//   props: {},
//   state: {
//     portals: [] as {
//       id: string;
//       type: "nodes" | "links";
//       x: number;
//       y: number;
//       data: {
//         type?: string;
//         width?: number;
//         height?: number;
//         left?: number;
//         top?: number;
//         scale?: number;
//         pdfDir?: string;
//         pageNumber?: number;
//         text?: string;
//       };
//       style: {};
//     }[],
//     hoveredDataType: "" as NodeDataTypes | "",
//     canvasSize: { width: 3000, height: 3000 },
//     scroll: { dx: 0, dy: 0 }
//   }
// };

// // import {pubs} from '@src/constants/pubs'
// const mapState = (state: iRootState) => ({
//   nodes: state.graph.nodes,
//   links: state.graph.links,
//   selectedNodes: state.graph.selectedNodes,
//   selectedLinks: state.graph.selectedLinks,
//   patches: state.graph.patches,
//   pdfRootDir: state.app.current.pdfRootDir,
//   pdfDir: state.app.current.pdfDir
// });

// const mapDispatch = ({
//   graph: { addBatch, removeBatch, updateBatch, toggleSelections }
// }: iDispatch) => ({
//   addBatch,
//   removeBatch,
//   updateBatch,
//   toggleSelections
// });

// type connectedProps = ReturnType<typeof mapState> &
//   ReturnType<typeof mapDispatch>;

// export class App extends React.Component<
//   connectedProps,
//   typeof AppDefaults.state
// > {
//   canvasRef = React.createRef<HTMLDivElement>();
//   scrollRef = React.createRef<HTMLDivElement>();
//   stage: konva.Stage;
//   state = AppDefaults.state;
//   // nodes: { [id: string]: Nodes };
//   // links: { [id: string]: Links };
//   nodeLayer: konva.Layer<konva.Node>;
//   linkLayer: konva.Layer<konva.Node>;

//   addNodeToLayer = node => {
//     this.nodeLayer.add(
//       new Konva.Circle({
//         id: node.id,
//         radius: 5,
//         x: Math.random() * 500,
//         y: Math.random() * 500,
//         fill: "black",
//         draggable: true,
//         ...node.style
//       })
//     );
//     this.nodeLayer.draw();
//   };

//   removeFromLayerById = (layer, id) => {
//     const toDel = layer.findOne("#" + id);
//     if (toDel) toDel.destroy();
//     layer.draw();
//   };

//   addLinkToLayer = link => {
//     const line = new Konva.Line({ id: link.id, ...link.style });
//     this.linkLayer.add(line);
//     this.linkLayer.draw();
//   };

//   componentDidUpdate(prevProps, prevState) {
//     if (prevProps.patches !== this.props.patches) {
//       console.log(this.props.patches)
      
//       this.props.patches.forEach(patch => {
//         const isNode = patch.path[0] === "nodes";
//         const layerName = isNode ? "nodeLayer" : "linkLayer";
//         if ("add" === patch.op) {
//           if (isNode) this.addNodeToLayer(patch.value);
//           if (!isNode) this.addLinkToLayer(patch.value);
//         }
//         if ("remove" === patch.op) {
//           this.removeFromLayerById(this[layerName], patch.value.id);
//         }
//         if ("replace" === patch.op) {
//           console.log("TODO GRAPH REPLACE PATCH");
//         }
//       });
//     }

//     if (prevProps.pdfDir !== this.props.pdfDir) {
//       //@ts-ignore
//       const current = this.nodeLayer.findOne("#" + this.props.pdfDir);
//       const prev = this.nodeLayer.findOne("#" + prevProps.pdfDir);

//       //@ts-ignore
//       if (prev) (prev as any).shadowEnabled(false);

//       //@ts-ignore
//       if (current)
//         (current as any)
//           //@ts-ignore
//           .shadowEnabled(true)
//           .setAttrs({
//             shadowColor: "yellow",
//             shadowBlur: 10,
//             shadowOffset: { x: 0, y: -5 },
//             shadowOpacity: 1
//           } as LineConfig);
//       this.nodeLayer.draw();
//     }

//     if (prevProps.selectedNodes !== this.props.selectedNodes) {
//       console.log(prevProps.selectedNodes, this.props.selectedNodes)
      
//       prevProps.selectedNodes.forEach(id => {
//         const n = this.nodeLayer.findOne("#" + id);
//         if (n) (n as any).shadowEnabled(false);
//       });

//       this.props.selectedNodes.forEach(id => {
//         const n = this.nodeLayer.findOne("#" + id);
//         if (n)
//           (n as any).shadowEnabled(true).setAttrs({
//             shadowColor: "blue",
//             shadowBlur: 20,
//             shadowOffset: { x: 0, y: 0 },
//             shadowOpacity: 1
//           } as CircleConfig);
//       });

//       this.nodeLayer.draw();
//     }
//   }

//   componentDidMount() {
//     this.stage = new Konva.Stage({
//       container: this.canvasRef.current, // id of container <div>
//       width: window.innerWidth,
//       height: window.innerHeight,
//       draggable: false
//     });
//     // this.stage.on("wheel", zoomWheel(this.stage));

//     this.nodeLayer = new Konva.Layer();
//     this.linkLayer = new Konva.Layer();
//     this.stage.add(this.nodeLayer);
//     this.stage.add(this.linkLayer);

//     Object.values(this.props.nodes).forEach(node => {
//       // todo rectanges (with icon) or text
//       this.nodeLayer.add(
//         new Konva.Circle({
//           id: node.id,
//           radius: 5,
//           x: Math.random() * 500,
//           y: Math.random() * 500,
//           fill: "black",
//           draggable: true,
//           ...node.style
//         })
//       );
//     });

//     const n = this.nodeLayer.findOne("#" + this.props.pdfDir);
//     //@ts-ignore

//     if (n)
//       (n as any).shadowEnabled(true).setAttrs({
//         shadowColor: "yellow",
//         shadowBlur: 10,
//         shadowOffset: { x: 0, y: -5 },
//         shadowOpacity: 1
//       } as LineConfig);
//     this.nodeLayer.draw();

//     Object.values(this.props.links).forEach(link => {
//       const line = new Konva.Line({ id: link.id, ...(link.style as any) });
//       this.linkLayer.add(line);
//     });
//     this.nodeLayer.on("dragmove dragend", e => {
//       this.setState({ hoveredDataType: "" });
//       //@ts-ignore
//       if (e.type === "dragmove") {
//         const _ = updateLinks(this.props.links, this.nodeLayer, this.linkLayer)(
//           e as konva.KonvaEventObject<DragEvent>
//         );
//         //@ts-ignore
//       } else if (e.type === "dragend") {
//         const updated = updateLinks(
//           this.props.links,
//           this.nodeLayer,
//           this.linkLayer
//         )(e as konva.KonvaEventObject<DragEvent>);
//         this.props.updateBatch(updated);
//       }
//     });

//     // draw the image
//     this.nodeLayer.setZIndex(1);
//     this.linkLayer.setZIndex(0);
//     this.stage.on("mouseover mouseout", e => {
//       let node = e.target;
//       let nodeType = "";
//       let id = e.target.getAttrs().id;
//       //@ts-ignore
//       if (e.type === "mouseover") {
//         node.strokeWidth(10);
//       } else {
//         node.strokeWidth(4);
//       }
//       if (e.target.getClassName() === "Circle") {
//         this.nodeLayer.draw();
//         nodeType = "nodes";
//       }
//       if (e.target.getClassName() === "Line") {
//         this.linkLayer.draw();
//         nodeType = "links";
//       }
//       //@ts-ignore
//       if (e.type === "mouseover") {
//         const { clientX, clientY } = e.evt as any;

//         const newState = {
//           id,
//           type: nodeType as "nodes" | "links",
//           x: clientX,
//           y: clientY,
//           data: this.props[nodeType][id].data,
//           style: this.props[nodeType][id].style
//         };
//         this.setState(state => {
//           return produce(state, draft => {
//             // todo debounce this i.e. don't insta popup
//             if (draft.portals.findIndex(p => p.id === id) < 0) {
//               draft.portals.push(newState);
//             }
//             draft.hoveredDataType = this.props[nodeType][id].data.type;
//           });
//         });
//       } else {
//         this.setState({ hoveredDataType: "" });
//       }
//     });

//     this.stage.on("click dblclick", e => {
//       // console.log("clearing hoveredDataType");

//       this.setState({ hoveredDataType: "" });
//       const coords = this.stage.getPointerPosition();
//       const { dx, dy } = this.state.scroll;
//       const { x, y } = { x: coords.x + dx, y: coords.y + dy };
//       const button = ["left", "middle", "right"][(e.evt as any).button];
//       //@ts-ignore
//       if (button === "left" && e.type === "dblclick") {
//         if (e.target.getType() === "Stage") {
//           // ADD NODE
//           let newNode = makeUserMediaText();
//           newNode.style = { ...newNode.style, x, y };
//           this.props.addBatch({ nodes: [newNode] });
//           // addNodeToLayer(newNode, this.nodeLayer, newNode.style);
//         } else if (e.target.getClassName() === "Circle") {
//           //REMOVE NODE and LINKS
//           const id = e.target.getAttrs().id;
//           this.nodeLayer.findOne("#" + id).destroy();
//           // todo remove links <--
//           const linksToDelete = getLinksIdsOnNode(id, this.props.links);

//           linksToDelete.forEach(linkId => {
//             this.linkLayer.findOne("#" + linkId).destroy();
//           });
//           this.onClosePortal(id);
//           this.props.removeBatch({ links: linksToDelete, nodes: [id] });
//           this.linkLayer.draw();
//           this.nodeLayer.draw();
//         } else if (e.target.getClassName() === "Line") {
//           const linkId = e.target.getAttrs().id;
//           this.onClosePortal(linkId);
//           this.linkLayer.findOne("#" + linkId).destroy();
//           this.props.removeBatch({ links: [linkId] });
//           this.linkLayer.draw();
//         }
//       }
//       //@ts-ignore
//       if (button === "left" && e.type === "click") {
//         // deselect all
//         if (e.target.getType() === "Stage") {

//           this.props.toggleSelections({
//             selectedLinks: [],
//             selectedNodes: [],
//             clearFirst: true
//           });

//         }
//         if (e.target.getClassName() === "Line") {
//           // todo combined line and circle cases
//           const id = e.target.getAttrs().id;

//           this.props.toggleSelections({ selectedLinks: [id] });
//         }
//       }
//       if (button === "left" && e.target.getClassName() === "Circle") {
//         const id = e.target.getAttrs().id;
//         this.props.toggleSelections({ selectedNodes: [id] });
//       } else if (button === "right" && e.target.getClassName() === "Circle") {
//         //todo links
//         const newLinks = linkSelectedToNode(
//           this.props.nodes,
//           this.props.selectedNodes,
//           e.target.getAttrs().id,
//           this.linkLayer,
//           this.nodeLayer
//         );
//         this.props.addBatch({ links: newLinks });
//         this.linkLayer.draw();
//       }
//     });
//     this.nodeLayer.draw();
//     this.linkLayer.draw();
//   }

//   onClosePortal = id => {
//     this.setState(state => {
//       const newState = produce(state, draft => {
//         draft.portals.splice(draft.portals.findIndex(p => p.id === id), 1);
//         return draft;
//       });
//       return newState;
//     });
//   };

//   onScroll = e => {
//     // todo fast scrolling ghosting, maybe css transition?
//     // or just put them on one layer
//     var dx = e.nativeEvent.target.scrollLeft;
//     var dy = e.nativeEvent.target.scrollTop;
//     this.setState({ scroll: { dx, dy } });
//     this.stage.x(-dx);
//     this.stage.y(-dy);
//     this.stage.batchDraw();
//   };

//   componentWillUnmount() {}

//   render() {
//     const { dx, dy } = this.state.scroll;

//     return (
//       <>
//         <ScrollContainer onScroll={this.onScroll} ref={this.scrollRef}>
//           <div
//             style={{
//               width: this.state.canvasSize.width,
//               height: this.state.canvasSize.height,
//               overflow: "hidden"
//             }}
//           >
//             <div
//               ref={this.canvasRef}
//               style={{ transform: "translate(" + dx + "px, " + dy + "px)" }}
//             />
//           </div>
//         </ScrollContainer>
//         {oc(this.state.portals).length() > 0 &&
//           this.state.portals.map(portal => {
//             // todo through redux
//             const { x, y } = portal;
//             const defaultSize = { width: 400, height: 200 };
//             let width = oc(portal).data.width();
//             width = width ? width + 100 : defaultSize.width;
//             let height = oc(portal).data.height();
//             height = height ? height + 100 : defaultSize.height;
//             return (
//               <Tooltip
//                 key={portal.id}
//                 mouseX={x}
//                 mouseY={y}
//                 width={width}
//                 height={height}
//                 close={this.state.hoveredDataType === ""}
//                 onClose={() => this.onClosePortal(portal.id)}
//               >
//                 {oc(portal).data.width() && (
//                   <PdfViewer
//                     pathInfo={{
//                       pdfRootDir: this.props.pdfRootDir,
//                       pdfDir: oc(portal).data.pdfDir()
//                     }}
//                     pageNumbersToLoad={[oc(portal).data.pageNumber()]}
//                     viewBox={{
//                       left: oc(portal).data.left() - 50,
//                       top: oc(portal).data.top() - 50,
//                       width: oc(portal).data.width() + 100,
//                       height: oc(portal).data.height() + 100,
//                       scale: oc(portal).data.scale()
//                     }}
//                   />
//                 )}
//                 {portal.data.type === "userMedia.text" && (
//                   <Formik
//                     initialValues={{
//                       //@ts-ignore
//                       text: this.props.nodes[portal.id].data.text
//                     }}
//                     onSubmit={(values, actions) => {
//                       this.props.updateBatch({
//                         nodes: [{ id: portal.id, data: { text: values.text } }]
//                       });
//                       actions.setSubmitting(false);
//                     }}
//                     render={props => (
//                       <form onSubmit={props.handleSubmit}>
//                         <textarea
//                           placeholder="Enter some text"
//                           style={{
//                             width: width - 5,
//                             height: height - 5,
//                             fontSize: 20,
//                             fontFamily: "aria"
//                           }}
//                           onChange={props.handleChange}
//                           onMouseLeave={() => {
//                             this.props.updateBatch({
//                               nodes: [
//                                 {
//                                   id: portal.id,
//                                   data: { text: props.values.text }
//                                 }
//                               ]
//                             });
//                           }}
//                           value={props.values.text}
//                           name="text"
//                         />
//                       </form>
//                     )}
//                   />
//                 )}
//                 {portal.data.type === "pdf.publication" && (
//                   <Formik
//                     initialValues={{
//                       //@ts-ignore
//                       text: this.props.nodes[portal.id].data.title
//                     }}
//                     onSubmit={(values, actions) => {
//                       this.props.updateBatch({
//                         //@ts-ignore
//                         nodes: [{ id: portal.id, data: { title: values.text } }]
//                       });
//                       actions.setSubmitting(false);
//                     }}
//                     render={props => (
//                       <form onSubmit={props.handleSubmit}>
//                         <textarea
//                           placeholder="Enter Paper Title"
//                           style={{
//                             width: width - 5,
//                             height: height - 5,
//                             fontSize: 20,
//                             fontFamily: "aria"
//                           }}
//                           onChange={props.handleChange}
//                           onMouseLeave={() => {
//                             this.props.updateBatch({
//                               nodes: [
//                                 {
//                                   id: portal.id,
//                                   //@ts-ignore
//                                   data: { title: props.values.text }
//                                 }
//                               ]
//                             });
//                           }}
//                           value={props.values.text}
//                           name="text"
//                         />
//                       </form>
//                     )}
//                   />
//                 )}
//                 {portal.type === "links" && (
//                   <Formik
//                     initialValues={{
//                       text: this.props.links[portal.id].data.type
//                     }}
//                     onSubmit={(values, actions) => {
//                       this.props.updateBatch({
//                         nodes: [{ id: portal.id, data: { type: values.text } }]
//                       });
//                       actions.setSubmitting(false);
//                     }}
//                     render={props => (
//                       <form onSubmit={props.handleSubmit}>
//                         <textarea
//                           placeholder="Enter Link Type"
//                           style={{
//                             width: width - 5,
//                             height: height - 5,
//                             fontSize: 20,
//                             fontFamily: "aria"
//                           }}
//                           onChange={props.handleChange}
//                           onMouseLeave={() => {
//                             this.props.updateBatch({
//                               links: [
//                                 {
//                                   id: portal.id,
//                                   data: { type: props.values.text }
//                                 }
//                               ]
//                             });
//                           }}
//                           value={props.values.text}
//                           name="text"
//                         />
//                       </form>
//                     )}
//                   />
//                 )}
//               </Tooltip>
//             );
//           })}
//       </>
//     );
//   }
// }

// export default connect(
//   mapState,
//   mapDispatch
// )(App);

// const linkSelectedToNode = (
//   nodes,
//   selectedNodeIds,
//   nodeId,
//   linkLayer,
//   nodeLayer
// ) => {
//   const sourceNode = nodeLayer.findOne("#" + nodeId);
//   let newLinks = [];
//   selectedNodeIds.forEach(targetId => {
//     const targetNode = nodeLayer.findOne("#" + targetId);
//     const newLink = makeLink(nodes[nodeId], nodes[targetId]);
//     const line = new Konva.Line(newLink.style);
//     newLinks.push(newLink);
//   });
//   linkLayer.draw();
//   return newLinks;
// };

// const getLinksIdsOnNode = (nodeId: string, links: Links) => {
//   let linksOnNode = [] as string[];
//   Object.values(links).forEach((link, key) => {
//     if ([link.source, link.target].includes(nodeId)) {
//       linksOnNode.push(link.id);
//     }
//   });
//   return linksOnNode;
// };

// const addNodeToLayer = (node, nodeLayer, style = {}) => {
//   // const id = Math.random() * 1000 + "";
//   const config = {
//     radius: 10,
//     fill: "blue",
//     stroke: "blue",
//     strokeWidth: 4,
//     draggable: true,
//     id: node.id,
//     ...style
//   };
//   nodeLayer.add(new Konva.Circle({ ...config }));
//   nodeLayer.draw();
// };

// const updateLinks = (
//   links: Links,
//   nodeLayer: konva.Layer<konva.Node>,
//   linkLayer: konva.Layer<konva.Node>
// ) => (
//   e: konva.KonvaEventObject<DragEvent>
// ): { nodes: DeepPartial<aNode>[]; links: DeepPartial<aLink>[] } => {
//   const movingId = e.target.id();

//   const movingNode = nodeLayer.find("#" + movingId)[0] as konva.Shape;
//   if (!movingNode) debugger;
//   const { x, y } = movingNode.getAttrs();

//   const updatedLinks = [] as DeepPartial<aLink>[];

//   for (let link of Object.values(links)) {
//     if (link.target === movingId || link.source === movingId) {
//       // todo in props.links but not linkLayer?
//       const line = linkLayer.findOne("#" + link.id) as konva.Line;
//       if (!line) debugger;
//       const p = line.points();

//       if (link.target === movingId) {
//         const points = [p[0], p[1], x, y];
//         line.points(points);
//         updatedLinks.push({ id: link.id, style: { points } });
//       }

//       if (link.source === movingId) {
//         const points = [x, y, p[2], p[3]];
//         line.points(points);
//         updatedLinks.push({ id: link.id, style: { points } });
//       }
//     }
//   }
//   linkLayer.draw();
//   return { links: updatedLinks, nodes: [{ id: movingId, style: { x, y } }] };
// };

// const zoomWheel = (stage, scaleBy = 1.2) => e => {
//   e.evt.preventDefault();
//   var oldScale = stage.scaleX();

//   var mousePointTo = {
//     x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
//     y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale
//   };

//   var newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
//   stage.scale({ x: newScale, y: newScale });

//   var newPos = {
//     x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
//     y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale
//   };
//   stage.position(newPos);
//   stage.batchDraw();
// };

// export const makeGridOfBoxes = (nRows, nCols, width, height, gap) => {
//   const rows = [...Array(nRows).keys()];
//   const cols = [...Array(nCols).keys()];
//   let x = 0;
//   let y = 0;
//   let boxes = [];
//   let id = 0;
//   for (let rowNum of rows) {
//     if (rowNum > 0) x += width + gap;
//     y = 0;
//     for (let colNum of cols) {
//       if (colNum > 0) y += height + gap;
//       boxes.push({ id: rowNum + "" + colNum + "" + id++, x, y, width, height });
//     }
//   }
//   return boxes;
// };
