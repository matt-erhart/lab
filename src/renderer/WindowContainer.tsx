import * as React from "react";
import styled from "styled-components";
import produce from "immer";
var equal = require("fast-deep-equal");
import { dragData } from "./rx";
import { Subscription } from "rxjs";
import { Rectangle, removeOverlaps } from "webcola";
import { ResizableFrame, updateOneFrame } from "./ResizableFrame";
// window container for...
// portal
// main layout
// virtualized map with svg layer

const windows = [
  { id: "1", left: 100, top: 100, height: 100, width: 100 },
  { id: "2", left: 101, top: 100, height: 100, width: 100 }
];

// todo rename window as FRAME cuz of window global
/**
 * @class **WindowContainer**
 */
const WindowContainerDefaults = {
  props: {},
  state: { windows: windows }
};
export class WindowContainer extends React.Component<
  typeof WindowContainerDefaults.props,
  typeof WindowContainerDefaults.state
> {
  static defaultProps = WindowContainerDefaults.props;
  state = WindowContainerDefaults.state;

  componentDidMount() {}
  onTransformEnd = transProps => {
    // todo here is where svg lines could be updated
    const updatedWindows = updateOneFrame(this.state.windows)(transProps);
    
    this.setState(state => {
      const updatedWindows = updateOneFrame(state.windows)(transProps);
      return { windows: updatedWindows };
    });
  };

  render() {
    return (
      <ViewportContainer>
        {this.state.windows.map(w => {
          const { left, top, width, height } = w;
          return (
            <ResizableFrame
              key={w.id}
              id={w.id}
              {...{ left, top, width, height }}
              onTransforming={this.onTransformEnd}
            >
              {" "}
              {w.id}{" "}
            </ResizableFrame>
          );
        })}
      </ViewportContainer>
    );
  }
}

const ViewportContainer = styled.div`
  --padding: 20px;
  --margin: 3px;
  --height: calc(100vh - 5px - var(--margin) - var(--padding) * 2);
  margin: var(--margin);
  padding: var(--padding);
  height: var(--height);
  border: 1px solid lightgrey;
  border-radius: 5px;
  font-size: 30px;
  overflow: none;
`;
