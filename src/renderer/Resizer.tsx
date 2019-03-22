// import * as React from "react";
// import styled from "styled-components";
// import { dndContainer } from "./rx";
// import { ResizeDivider } from "./ResizeDivider";
// /**
//  * @class **Resizer**
//  */
// const ResizerDefaults = {
//   props: {},
//   state: { width: 0 }
// };
// export class Resizer extends React.Component<
//   typeof ResizerDefaults.props,
//   typeof ResizerDefaults.state
// > {
//   static defaultProps = ResizerDefaults.props;
//   state = ResizerDefaults.state;
//   sub;
//   dndRef = React.createRef<HTMLDivElement>();
//   // componentDidMount() {
//   //   this.sub = dndContainer(this.dndRef).subscribe(mouse => {
//   //     console.log(mouse);
//   //   });
//   // }

//   // componentWillUnmount() {
//   //   this.sub.unsubscribe();
//   // }

//   render() {
//     const { width } = this.state;
//     return (
//       <ViewportContainer>
//         <FlexContainer ref={this.dndRef}>
//           <FlexItem
//             style={{ minWidth: width, flex: width > 0 ? 0 : 1 }}

//             // onDragOver={e => {
//             //   e.dataTransfer.dropEffect = 'move'
//             //   e.preventDefault();
//             // }}
//           >
//             {" "}
//           </FlexItem>
//           <ResizeDivider />
//           {/* <VerticalDragBar
//             draggable
//             onDragStart={e => {
//               e.dataTransfer.setDragImage(new Image(), 0, 0);
//             }}
//             onDrag={e => {
//               if (e.clientX > 0) {
//                 var rect = this.dndRef.current.getBoundingClientRect();
//                 var x = e.clientX - rect.left; //x position within the element.
//                 var y = e.clientY - rect.top; //y position within the element.
//                 this.setState({ width: x - 5 });
//               }
//             }}
//             onDragOver={e => {
//               e.preventDefault();
//             }}
//             onDrop={e => {
//               e.preventDefault();
//             }}
//           /> */}
//           <FlexItem
//             // onDragOver={e => {
//             //   e.dataTransfer.dropEffect = 'move'
//             //   e.preventDefault();
//             // }}
//           >
//             {" "}
//           </FlexItem>
//         </FlexContainer>
//       </ViewportContainer>
//     );
//   }
// }

// const isPadding = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
//   let element = e.nativeEvent.target as HTMLDivElement;
//   var style = window.getComputedStyle(element, null);
//   var pTop = parseInt(style.getPropertyValue("padding-top"));
//   var pRight = parseFloat(style.getPropertyValue("padding-right"));
//   var pLeft = parseFloat(style.getPropertyValue("padding-left"));
//   var pBottom = parseFloat(style.getPropertyValue("padding-bottom"));
//   var width = element.offsetWidth;
//   var height = element.offsetHeight;
//   var x = e.nativeEvent.offsetX;
//   var y = e.nativeEvent.offsetY;

//   return !(
//     x > pLeft &&
//     x < width - pRight &&
//     (y > pTop && y < height - pBottom)
//   );
// };

// const ViewportContainer = styled.div`
//   --padding: 20px;
//   --margin: 3px;
//   --height: calc(100vh - 5px - var(--margin) - var(--padding) * 2);
//   margin: var(--margin);
//   padding: var(--padding);
//   height: var(--height);
//   border: 1px solid lightgrey;
//   border-radius: 5px;
//   font-size: 30px;
//   overflow: none;
// `;

// const VerticalDragBar = styled.div`
//   min-width: 5px;
//   max-width: 5px;
//   padding: 5px;
//   background-color: "black";
//   cursor: col-resize !important;
//   user-select: none;
//   &:active{
//     cursor: col-resize;
//   }
//   &:hover{
//     cursor: col-resize;
//   }
// `;

// const HorizontalDragBar = styled(VerticalDragBar)`
//   cursor: row-resize;
// `;

// const GridContainer = styled.div`
//   display: grid;
//   grid-template-columns: 50%;
// `;

// const FlexItem = styled.div`
//   flex: 1;
//   outline: 1px solid lightsteelblue;
// `;

// const FlexContainer = styled.div`
//   display: flex;
//   flex-direction: row;
//   min-width: 100%;
//   min-height: 100%;
// `;
