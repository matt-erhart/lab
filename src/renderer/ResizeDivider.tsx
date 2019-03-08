import * as React from "react";
import styled from "styled-components";
import { Subscription } from "rxjs";
import { dndContainer, dragData } from "./rx";
import * as Rx from "rxjs";

const Divider = styled.div`
  min-width: 2px;
  max-width: 2px;
  padding: 2px;
  background-color: "black";
  cursor: col-resize !important;
  user-select: none;
`;

/**
 * @class **ResizeDivider**
 */
const ResizeDividerDefaults = {
  props: { vertical: true, containerRef: undefined as React.RefObject<any> },
  state: {}
};
export class ResizeDivider extends React.Component<
  typeof ResizeDividerDefaults.props,
  typeof ResizeDividerDefaults.state
> {
  static defaultProps = ResizeDividerDefaults.props;
  state = ResizeDividerDefaults.state;
  dividerRef = React.createRef<HTMLDivElement>();
  sub: Subscription;

  componentDidMount() {

    this.sub = dragData(this.dividerRef.current).subscribe(data => {
      console.log(data)
      // todo dragToTransform 
    })
  }

  componentWillUnmount() {
    this.sub.unsubscribe();
  }

  render() {
    return (
      <Divider
        ref={this.dividerRef}
        style={{ cursor: this.props.vertical ? "col-resize" : "row-resize" }}
        // onMouseDown={e => {e.stopPropagation(); this.subject.next('mousedown')}}
        // onMouseMove={e => {e.stopPropagation(); this.subject.next('mousedown')}}
        // onMouseUp={e => {e.stopPropagation(); this.subject.next('mousedown')}}
      />
    );
  }
}
{
  /* <VerticalDragBar
  onDrag={e => {
    if (e.clientX > 0) {
      var rect = this.containerRef.current.getBoundingClientRect();
      var x = e.clientX - rect.left; //x position within the element.
      var y = e.clientY - rect.top; //y position within the element.
      this.setState({ width: x - 3 });
    }
  }}
/>; */
}
