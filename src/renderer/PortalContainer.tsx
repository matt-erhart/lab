import * as React from "react";
import { Portal } from "./Portal";
import { ResizableFrame, frame, updateOneFrame } from "./ResizableFrame";
import styled from "styled-components";
import produce from "immer";
import { iRootState, iDispatch } from "../store/createStore";
import { connect } from "react-redux";
import TextEditor from "./TextEditor";
import { Rectangle, removeOverlaps } from "webcola";
const frames = [
  { id: "1", left: 100, top: 300, height: 100, width: 100 },
  { id: "2", left: 101, top: 100, height: 100, width: 100 }
];
/**
 * @class **PortalContainer**
 */
const PortalContainerDefaults = {
  props: {},
  state: {}
};

const mapState = (state: iRootState) => ({
  portals: state.app.portals,
  nodes: state.graph.nodes,
  links: state.graph.links
});

const mapDispatch = ({
  graph: { addBatch, updateBatch },
  app: { updatePortals, addPortals, removePortals }
}: iDispatch) => ({ updatePortals, addPortals, removePortals, updateBatch });

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

class PortalContainer extends React.Component<
  typeof PortalContainerDefaults.props & connectedProps,
  typeof PortalContainerDefaults.state
> {
  static defaultProps = PortalContainerDefaults.props;
  state = PortalContainerDefaults.state;

  onTransformStart = (transProps: frame) => {
    const { id } = transProps;
    //todo select with redux
  };

  componentDidMount() {
    // this.props.addPortals([
    //   { id: "asdf", left: 110, top: 111, width: 111, height: 111 }
    // ]);
  }

  componentDidUpdate(prevProps, prevState) {
    // console.log(this.props.portals.length, prevProps.portals.length)
    
    // if (this.props.portals.length > prevProps.portals.length) {
    //   let rects = this.props.portals.map(w => {
    //     const { left, top, width, height } = w;
    //     return new Rectangle(left, left + width, top+left, top + height);
    //   });
    //   removeOverlaps(rects);
    //   const shiftedPortals = rects.map((r, ix) => {
    //     const left = r.x;
    //     const width = r.X - r.x;
    //     const height = r.Y - r.y;
    //     const top = r.y;
    //     return { id: this.props.portals[ix].id, left, width, height, top };
    //   });
    //   this.props.updatePortals(shiftedPortals);
    // }
  }

  onTransforming = (transProps: frame) => {
    const updated = updateOneFrame(this.props.portals)(transProps);
    this.props.updatePortals(updated);
  };

  onTransformEnd = (transProps: frame) => {
    const { id, left, top, width, height } = transProps;
    // this.props.updateBatch({ nodes: [{ id, style: { width, height } }] });
  };

  onClose = id => e => {
    this.props.removePortals([id]);
  };

  render() {
    return (
      <>
        <Portal>
          {this.props.portals.length > 0 &&
            this.props.portals.map(frame => {
              const { left, top, width, height } = frame;
              return (
                <ResizableFrame
                  key={frame.id}
                  id={frame.id}
                  {...{ left, top, width, height }}
                  onTransforming={this.onTransforming}
                  onTransformEnd={this.onTransformEnd}
                  isSelected={false}
                  dragHandle={<TopBar onClose={this.onClose(frame.id)} />}
                  // dragHandle={<DragHandle/>}
                >
                  <div
                    key={frame.id}
                    style={{ flex: 1 }}
                    // onMouseEnter={e => this.setState({ editingId: node.id })}
                  >
                    <TextEditor
                      key={frame.id}
                      width={frame.width - 13}
                      height={frame.height - 23}
                      id={frame.id}
                      // readOnly={this.state.editingId !== node.id}
                    />
                  </div>
                </ResizableFrame>
              );
            })}
        </Portal>
      </>
    );
  }
}

export default connect(
  mapState,
  mapDispatch
)(PortalContainer);

const DragHandle = styled.div`
  background-color: lightgreen;
  min-height: 10px;
  flex: 0;
  user-select: none;
  &:hover {
    cursor: all-scroll;
  }
`;

const TopBar = props => {
  const { onClose, ...rest } = props;
  return (
    <DragHandle {...rest}>
      <b
        style={{
          float: "right",
          fontSize: "10px",
          marginRight: 3,
          cursor: "pointer",
          display: "inline-block",
          backgroundColor: "lightgrey"
        }}
        {...props}
        onClick={e => onClose()}
      >
        X
      </b>
    </DragHandle>
  );
};
