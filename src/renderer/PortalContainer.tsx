import * as React from "react";
import { Portal } from "./Portal";
import { ResizableFrame, frame, updateOneFrame } from "./ResizableFrame";
import styled from "styled-components";
const frames = [
  { id: "1", left: 100, top: 300, height: 100, width: 100 },
  { id: "2", left: 101, top: 100, height: 100, width: 100 }
];
/**
 * @class **PortalContainer**
 */
const PortalContainerDefaults = {
  props: {
    left: 0,
    top: 0,
    width: 0,
    height: 0
  },
  state: { frames: frames as frame[] }
};

export default class PortalContainer extends React.Component<
  typeof PortalContainerDefaults.props,
  typeof PortalContainerDefaults.state
> {
  static defaultProps = PortalContainerDefaults.props;
  state = PortalContainerDefaults.state;
  onTransformStart = (transProps: frame) => {
    const { id } = transProps;
    //todo select with redux
  };

  onTransforming = (transProps: frame) => {
    // todo here is where svg lines could be updated
    const updatedWindows = updateOneFrame(this.state.frames)(transProps);
    this.setState(state => {
      const updatedWindows = updateOneFrame(state.frames)(transProps);
      return { frames: updatedWindows };
    });
  };

  onTransformEnd = (transProps: frame) => {
    const { id, left, top, width, height } = transProps;
  };

  render() {
    return (
      <>
        <Portal>
          {this.state.frames.length > 0 &&
            this.state.frames.map(frame => {
              const { left, top, width, height } = frame;
              return (
                <ResizableFrame
                  key={frame.id}
                  id={frame.id}
                  {...{ left, top, width, height }}
                  onTransforming={this.onTransforming}
                //   onTransformEnd={this.onTransformEnd}
                  isSelected={false}
                  dragHandle={<DragHandle />}
                >
                  TEXT
                </ResizableFrame>
              );
            })}
        </Portal>
      </>
    );
  }
}

const DragHandle = styled.div`
  background-color: lightgreen;
  min-height: 10px;
  flex: 0;
  user-select: none;
  &:hover {
    cursor: all-scroll;
  }
`;
