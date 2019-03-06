// import * as React from "react";
// import * as d3 from "d3";

// const graph = {
//   nodes: [
//     { id: "1", group: 1 },
//     { id: "2", group: 1 },
//     { id: "3", group: 1 },
//     { id: "4", group: 1 },
//     { id: "5", group: 1 },
//     { id: "6", group: 1 },
//     { id: "7", group: 1 }
//   ],
//   links: [
//     { source: "1", target: "2", value: 1 },
//     { source: "2", target: "4", value: 8 },
//     { source: "7", target: "5", value: 10 },
//     { source: "5", target: "2", value: 6 }
//   ]
// };

// /**
//  * @class **D3Force**
//  */
// const D3ForceDefaults = {
//   props: {},
//   state: {}
// };
// export class D3Force extends React.Component<
//   typeof D3ForceDefaults.props,
//   typeof D3ForceDefaults.state
// > {
//     static defaultProps = D3ForceDefaults.props;
//     state = D3ForceDefaults.state;
//     private canvasLayer = React.createRef<HTMLCanvasElement>();
//     private canvasContext: CanvasRenderingContext2D;


//   simulation

//   ticked() {
//     this.canvasContext.clearRect(
//       0,
//       0,
//       document.documentElement.clientWidth,
//       document.documentElement.clientHeight
//     );

//     this.canvasContext.beginPath();
//     graph.links.forEach(this.drawLink);
//     this.canvasContext.strokeStyle = "#aaa";
//     this.canvasContext.stroke();

//     this.canvasContext.beginPath();
//     graph.nodes.forEach(this.drawNode);
//     this.canvasContext.fill();
//     this.canvasContext.strokeStyle = "#fff";
//     this.canvasContext.stroke();
//   }

//   dragsubject() {
//     return this.simulation.find(d3.event.x, d3.event.y);
//   }

//   dragstarted() {
//     if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
//     d3.event.subject.fx = d3.event.subject.x;
//     d3.event.subject.fy = d3.event.subject.y;
//   }

//   dragged() {
//     d3.event.subject.fx = d3.event.x;
//     d3.event.subject.fy = d3.event.y;
//   }

//   dragended() {
//     if (!d3.event.active) this.simulation.alphaTarget(0);
//     d3.event.subject.fx = null;
//     d3.event.subject.fy = null;
//   }

//   drawLink(d) {
//     this.canvasContext.moveTo(d.source.x, d.source.y);
//     this.canvasContext.lineTo(d.target.x, d.target.y);
//   }

//   drawNode(d) {
//     this.canvasContext.moveTo(d.x + 3, d.y);
//     this.canvasContext.arc(d.x, d.y, 3, 0, 2 * Math.PI);
//   }

//   async componentDidMount() {
//     const {
//         // doesn't include scroll bars
//         clientHeight,
//         clientWidth
//       } = document.documentElement;
//     this.canvasLayer.current.height = clientWidth;
//     this.canvasLayer.current.width = clientHeight;
//     this.canvasContext = this.canvasLayer.current.getContext("2d");
//     this.simulation = d3
//     .forceSimulation()
//     .force(
//       "link",
//       d3.forceLink().id(function(d) {
//         return d.id;
//       })
//     )
//     .force("charge", d3.forceManyBody())
//     .force(
//       "center",
//       d3.forceCenter(
//         clientWidth / 2,
//         clientHeight / 2
//       )
//     );
//     this.simulation.nodes(graph.nodes).on("tick", this.ticked);

//     this.simulation.force("link").links(graph.links);

//     d3.select(this.canvasLayer.current).call(
//       d3
//         .drag()
//         .container(this.canvasLayer.current)
//         .subject(this.dragsubject)
//         .on("start", this.dragstarted)
//         .on("drag", this.dragged)
//         .on("end", this.dragended)
//     );
//   }

//   render(){
//       return <canvas ref={this.canvasLayer} />
//   }
// }
