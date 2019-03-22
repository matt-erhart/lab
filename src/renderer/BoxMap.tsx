// import * as React from "react";
// import styled from "styled-components";
// import { makeGridOfBoxes, getBoxEdges, isBoxInBox } from "./utils";
// import { iDispatch, iRootState } from "../store/createStore";
// import { connect } from "react-redux";
// import ReactHtmlParser from "react-html-parser";
// import { dragData } from "./rx";
// import { Subscription } from "rxjs";
// import { Portal } from "./Portal";
// import produce from "immer";
// import { Tooltip } from "./Tooltip";
// import TextEditor from "./TextEditor";
// import { NodeDataTypes, ViewboxData } from "../store/creators";
// import PdfViewer from "./PdfViewer";

// /**
//  * @class **BoxMap**
//  */

// const BoxMapDefaults = {
//   state: {
//     dx: 0,
//     dy: 0,
//     width: 0,
//     height: 0,
//     boxesInView: [] as {
//       id: string;
//       left: number;
//       top: number;
//       width: number;
//       height: number;
//       data: {};
//       isSelected: boolean;
//     }[],
//     dragX: 0,
//     dragY: 0,
//     editors: [] as {
//       id: string;
//       nodesOrLinks: string;
//       left: number;
//       top: number;
//       width: number;
//       height: number;
//     }[],
//     editingId: ""
//   }
// };
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
// type props = typeof BoxMapDefaults.props & connectedProps;
// export class BoxMap extends React.Component<
//   props,
//   typeof BoxMapDefaults.state
// > {
//   static defaultProps = BoxMapDefaults.props;
//   state = BoxMapDefaults.state;
//   scrollRef = React.createRef<HTMLDivElement>();
//   mapRef = React.createRef<HTMLDivElement>();
//   sub: Subscription;
//   transform;

//   // shouldComponentUpdate(
//   //   nextProps: props,
//   //   nextState: typeof BoxMapDefaults.state
//   // ) {
//   //   console.log(nextState.boxesInView !== this.state.boxesInView)
//   //   return nextState.boxesInView !== this.state.boxesInView
//   // }

//   componentDidMount() {
//     this.setSize();
//     window.addEventListener("resize", this.setSize);

//     let lastMove;
//     this.sub = dragData(this.mapRef.current).subscribe(data => {
//       // todo add if click certain elements
//       // if (this.props.selectedNodes.length === 0) return null;
//       if (data.type === "mousedown") {
//         lastMove = data;
//         this.setState({ dragX: 0, dragY: 0 });
//       }
//       if (data.type === "mousemove") {
//         lastMove = data;
//         this.setState({ dragX: data.x, dragY: data.y });
//       }
//       if (data.type === "mouseup") {
//         const update = this.props.selectedNodes.map(id => {
//           const { x, y } = this.props.nodes[id].style;
//           return { id, style: { x: x + lastMove.x, y: y + lastMove.y } };
//         });
//         this.props.updateBatch({ nodes: update });
//         this.setState({ dragX: 0, dragY: 0 });
//       }
//     });
//   }

//   setSize = () => {
//     const height = this.scrollRef.current.clientHeight;
//     const width = this.scrollRef.current.clientWidth;
//     this.setState({ width, height });
//   };

//   onScroll = e => {
//     var dx = e.nativeEvent.target.scrollLeft;
//     var dy = e.nativeEvent.target.scrollTop;
//     this.setState({ dx, dy });
//   };

//   componentWillUnmount() {
//     window.removeEventListener("resize", this.setSize);
//     this.sub.unsubscribe();
//   }

//   static getDerivedStateFromProps(props, state) {
//     // perf: 100k ~9ms, 10k ~1ms. ~200 items rendered at once @60fps scrollings
//     const { dx, dy, width, height, dragX, dragY } = state;
//     const view = getBoxEdges(dx, dy, width, height);
//     const isInView = isBoxInBox(view);
//     const userHtml = Object.values(props.nodes).filter(n => {
//       const { x, y } = n.style;
//       const edges = { minX: x, minY: y, maxX: x + 100, maxY: y + 100 };
//       return true; //isInView(edges);
//     });

//     const boxesInView = userHtml.map(h => {
//       const isSelected = props.selectedNodes.includes(h.id);
//       const transX = isSelected ? dragX : 0;
//       const transY = isSelected ? dragY : 0;

//       return {
//         id: h.id,
//         left: h.style.x + transX,
//         top: h.style.y + transY,
//         width: 50,
//         height: 50,
//         data: h.data,
//         isSelected
//       };
//     });

//     return { boxesInView };
//   }

//   mousedownBox = box => e => {
//     e.nativeEvent.stopPropagation();
//     if (typeof box.id === "string") {
//       if (!box.isSelected && !e.shiftKey) {
//         this.props.toggleSelections({
//           selectedNodes: [box.id],
//           clearFirst: true
//         });
//       }

//       if (e.shiftKey) {
//         this.props.toggleSelections({ selectedNodes: [box.id] });
//       }
//     }
//   };

//   clickBox = box => e => {
//     e.stopPropagation();
//   };

//   deselectAll = e => {
//     if (!e.shiftKey)
//       this.props.toggleSelections({ selectedNodes: [], clearFirst: true });
//   };

//   onDoubleClick = box => (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
//     this.setState({ editingId: box.id });
//     // const bbox = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
//     // const { left, top, width, height } = bbox;
//     // this.props.toggleSelections({ selectedNodes: [], clearFirst: true });

//     // this.setState(state => {
//     //   return produce(state, draft => {
//     //     draft.editors.push({
//     //       id: box.id,
//     //       left,
//     //       top,
//     //       width,
//     //       height,
//     //       nodesOrLinks: "nodes"
//     //     });
//     //   });
//     // });
//   };
//   onKey = e => {
//     const key2cmd = {
//       Delete: () => {
//         this.props.removeBatch({ nodes: this.props.selectedNodes });
//         this.props.toggleSelections({ selectedNodes: [], clearFirst: true });
//       }
//     };
//     key2cmd[e.key]();
//     console.log(e.key);
//   };

//   onLeaveEditor = e => {
//     this.setState({ editingId: "" });
//   };

//   renderBox = (box: typeof BoxMapDefaults.state.boxesInView) => {
//     switch (box.data.type as NodeDataTypes) {
//       case "pdf.publication":
//         return (
//           <div
//             style={{ backgroundColor: "white", padding: 5, maxWidth: 300 }}
//             draggable={false}
//           >
//             {box.data.pdfDir.replace("-", " ")}
//           </div>
//         );
//       case "userHtml":
//         return (
//           <div
//             style={{ backgroundColor: "white", padding: 5, maxWidth: 300 }}
//             onMouseLeave={this.onLeaveEditor}
//           >
//             {/* {ReactHtmlParser(box.data.html)} */}
//             <TextEditor
//               key={box.id}
//               id={box.id}
//               readOnly={this.state.editingId !== box.id}
//             />
//           </div>
//         );
//       case "pdf.segment.viewbox":
//         const { pdfRootDir } = this.props;
//         const {
//           pdfDir,
//           left,
//           top,
//           width,
//           height,
//           scale,
//           pageNumber
//         } = box.data as ViewboxData;

//         const pagenum = [pageNumber];
//         return (
//           <PdfViewer
//             key={box.data.id}
//             pageNumbersToLoad={pagenum}
//             {...{
//               pdfRootDir,
//               pdfDir,
//               left: left - 50,
//               top: top - 50,
//               width: width + 100,
//               height: height + 100,
//               scale
//             }}
//           />
//         );
//     }
//   };

//   render() {
//     return (
//       <ScrollContainer
//         ref={this.scrollRef}
//         onScroll={this.onScroll}
//         onKeyUp={this.onKey}
//         tabIndex={0}
//       >
//         <MapContainer ref={this.mapRef} onClick={this.deselectAll}>
//           {this.state.boxesInView.map(box => {
//             return (
//               <div
//                 key={box.id}
//                 style={{
//                   position: "absolute",
//                   left: box.left,
//                   top: box.top,
//                   width: "auto",
//                   height: "auto",
//                   borderRadius: 7,
//                   border: box.isSelected
//                     ? "4px solid hsl(198, 100%, 50%)"
//                     : "4px solid lightgrey"
//                 }}
//                 onMouseDown={this.mousedownBox(box)}
//                 onClick={this.clickBox(box)}
//                 onDoubleClick={this.onDoubleClick(box)}
//               >
//                 <div
//                   draggable={false}
//                   style={{
//                     userSelect: "none",
//                     paddingTop: 15,
//                     backgroundColor: "lightgrey"
//                   }}
//                 >
//                   {/* {ReactHtmlParser(box.html)} */}
//                   {this.renderBox(box)}
//                 </div>
//               </div>
//             );
//           })}
//         </MapContainer>
//         {/* {this.state.editors.length > 0 &&
//           this.state.editors.map((editor, ix) => {
//             const { id, left, top, width, height } = editor;
//             return (
//               <Tooltip
//                 key={ix}
//                 // style={{
//                 //   position: "absolute",
//                 //   left,
//                 //   top,
//                 //   width: 300,
//                 //   height: 300,
//                 //   backgroundColor: "lightblue"
//                 // }}
//                 mouseX={left}
//                 mouseY={top}
//                 width={400}
//                 height={300}
//               >
//                 <TextEditor key={editor.id} id={editor.id} />
//               </Tooltip>
//             );
//           })} */}
//       </ScrollContainer>
//     );
//   }
// }
// export default connect(
//   mapState,
//   mapDispatch
// )(BoxMap);

// const ScrollContainer = styled.div`
//   overflow: auto;
//   /* width: 100vw;
//   height: 100vh; */
//   max-width: calc(50vw - 22px);
// `;

// const MapContainer = styled.div`
//   width: 10000px;
//   height: 10000px;
//   position: relative;
// `;
