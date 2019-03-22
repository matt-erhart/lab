import * as React from "react";
import styled from "styled-components";
import { Subscription } from "rxjs";
import { dndContainer, dragData, mData } from "./rx";
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
  props: {
    vertical: true,
    containerRef: undefined as React.RefObject<any>,
    onTransforming: (mouseData: mData) => {}
  },
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

  onMouseDown = e => {
    e.stopPropagation();
    this.sub = dragData(e).subscribe(data => {
      this.props.onTransforming(data);
      // todo dragToTransform
    });
  };

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe();
  }

  render() {
    return (
      <Divider
        ref={this.dividerRef}
        style={{ cursor: this.props.vertical ? "col-resize" : "row-resize" }}
        onMouseDown={this.onMouseDown}
      />
    );
  }
}
