import * as React from "react";
import styled from "styled-components";
import { makeGridOfBoxes, getBoxEdges, isBoxInBox } from "./utils";
import { iDispatch, iRootState } from "../store/createStore";
import { connect } from "react-redux";
import ReactHtmlParser from "react-html-parser";
import { dragData } from "./rx";
import { Subscription } from "rxjs";
const boxes = makeGridOfBoxes(100, 1000, 10, 10, 50).map(x => {
  return { left: x.x, top: x.y, ...x };
});

/**
 * @class **BoxMap**
 */

const BoxMapDefaults = {
  props: { boxes: boxes },
  state: {
    dx: 0,
    dy: 0,
    width: 0,
    height: 0,
    boxesInView: [],
    dragX: 0,
    dragY: 0
  }
};
const mapState = (state: iRootState) => ({
  nodes: state.graph.nodes,
  links: state.graph.links,
  selectedNodes: state.graph.selectedNodes,
  selectedLinks: state.graph.selectedLinks,
  patches: state.graph.patches,
  pdfRootDir: state.app.current.pdfRootDir,
  pdfDir: state.app.current.pdfDir
});

const mapDispatch = ({
  graph: { addBatch, removeBatch, updateBatch, toggleSelections }
}: iDispatch) => ({
  addBatch,
  removeBatch,
  updateBatch,
  toggleSelections
});

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

export class BoxMap extends React.Component<
  typeof BoxMapDefaults.props & connectedProps,
  typeof BoxMapDefaults.state
> {
  static defaultProps = BoxMapDefaults.props;
  state = BoxMapDefaults.state;
  scrollRef = React.createRef<HTMLDivElement>();
  mapRef = React.createRef<HTMLDivElement>();
  sub: Subscription;
  transform;

  componentDidMount() {
    this.setSize();
    window.addEventListener("resize", this.setSize);
    let lastMove;
    this.sub = dragData().subscribe(data => {
      if (data.type === "mousedown") {
        lastMove = data;
        this.setState({ dragX: 0, dragY: 0 });
      }
      if (data.type === "mousemove") {
        lastMove = data;
        this.setState({ dragX: data.x, dragY: data.y });
      }
      if (data.type === "mouseup") {
        console.log("last move", lastMove);
        const update = this.props.selectedNodes.map(id => {
          const { x, y } = this.props.nodes[id].style;
          return { id, style: { x: x + lastMove.x, y: y + lastMove.y } };
        });
        this.props.updateBatch({ nodes: update });
        this.setState({ dragX: 0, dragY: 0 });
      }
    });
  }

  setSize = () => {
    const height = this.scrollRef.current.clientHeight;
    const width = this.scrollRef.current.clientWidth;
    this.setState({ width, height });
  };

  onScroll = e => {
    var dx = e.nativeEvent.target.scrollLeft;
    var dy = e.nativeEvent.target.scrollTop;
    this.setState({ dx, dy });
  };

  componentWillUnmount() {
    window.removeEventListener("resize", this.setSize);
    this.sub.unsubscribe();
  }

  static getDerivedStateFromProps(props, state) {
    // perf: 100k ~9ms, 10k ~1ms. ~200 items rendered at once @60fps scrollings
    const { dx, dy, width, height, dragX, dragY } = state;
    const view = getBoxEdges(dx, dy, width, height);
    const isInView = isBoxInBox(view);
    const userHtml = Object.values(props.nodes).filter(n => {
      // todo convert to boxes left,top, width, height
      return n.data.type === "userHtml";
    });
    const boxesInView = userHtml.map(h => {
      const isSelected = props.selectedNodes.includes(h.id);
      const transX = isSelected ? dragX : 0;
      const transY = isSelected ? dragY : 0;

      return {
        id: h.id,
        left: h.style.x + transX,
        top: h.style.y + transY,
        width: 50,
        height: 50,
        html: h.data.html,
        isSelected
      };
    });

    return { boxesInView };
  }

  // getBoxesInView = () => {
  //   // perf: 100k ~9ms, 10k ~1ms. ~200 items rendered at once @60fps scrollings
  //   const { dx, dy, width, height } = this.state;
  //   const view = getBoxEdges(dx, dy, width, height);
  //   const isInView = isBoxInBox(view);
  //   const userHtml = Object.values(this.props.nodes).filter(n => {
  //     // todo convert to boxes left,top, width, height
  //     return n.data.type === "userHtml";
  //   });
  //   const boxes = userHtml.map(h => ({
  //     id: h.id,
  //     left: h.style.x,
  //     top: h.style.y,
  //     width: 50,
  //     height: 50,
  //     html: h.data.html
  //   }));

  //   return boxes;
  // };

  toggleSelect = id => () => {
    console.log(id);
    if (typeof id === "string") {
      this.props.toggleSelections({ selectedNodes: [id] });
    }
  };

  render() {
    return (
      <ScrollContainer ref={this.scrollRef} onScroll={this.onScroll}>
        <MapContainer ref={this.mapRef}>
          {this.state.boxesInView.map(b => {
            return (
              <div
                key={b.id}
                style={{
                  position: "absolute",
                  left: b.left,
                  top: b.top,
                  width: "auto",
                  height: "auto",
                  border: b.isSelected ? "4px solid blue" : "1px solid blue"
                }}
                onMouseDown={this.toggleSelect(b.id)}
              >
                <div style={{ userSelect: "none" }}>
                  {ReactHtmlParser(b.html)}
                </div>
              </div>
            );
          })}
        </MapContainer>
      </ScrollContainer>
    );
  }
}
export default connect(
  mapState,
  mapDispatch
)(BoxMap);

const ScrollContainer = styled.div`
  overflow: auto;
  /* width: 100vw;
  height: 100vh; */
  max-width: calc(50vw - 22px);
`;

const MapContainer = styled.div`
  width: 10000px;
  height: 10000px;
  position: relative;
`;
