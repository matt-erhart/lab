import * as React from "react";

import { iRootState, iDispatch } from "../store/createStore";
import { connect } from "react-redux";
import PdfViewer from "./PdfViewer";
import { ScrollContainer } from "./GraphContainer";
import styled from "styled-components";
import { aNode } from "../store/creators";
import console = require("console");
/**
 * @class **ListView**
 */

const ListViewDefaults = {
  props: {},
  state: { nodes: [], pdfDir: "" }
};
const mapState = (state: iRootState, props: typeof ListViewDefaults) => {
  return {
    nodes: state.graph.nodes,
    // links: state.graph.links,
    patches: state.graph.patches, // todo faster filter
    pdfDir: state.app.panels.mainPdfReader.pdfDir,
    pdfRootDir: state.app.current.pdfRootDir,
    selectedNodes: state.graph.selectedNodes
  };
};

const mapDispatch = ({
  graph: { removeBatch, toggleSelections }
}: iDispatch) => ({ removeBatch, toggleSelections });

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;
export class ListView extends React.Component<
  typeof ListViewDefaults.props & connectedProps,
  typeof ListViewDefaults.state
> {
  static defaultProps = ListViewDefaults.props;
  state = ListViewDefaults.state;

  static getDerivedStateFromProps(props, state) {
    const nodes =
      (Object.values(props.nodes) as aNode[]).filter(node => {
        return (
          node.data.type === "pdf.segment.viewbox" &&
          ("pdfDir" in node.data ? node.data.pdfDir === props.pdfDir : false)
        );
      }) || [];

    if (props.pdfDir !== state.pdfDir || nodes.length !== state.nodes.length) {
      return { pdfDir: props.pdfDir, nodes: nodes.sort().reverse() };
    } else {
      return null;
    }
  }

  toggleSelect = id => e => {
    this.props.toggleSelections({ selectedNodes: [id] });
  };

  onKeyUp = e => {
    if (e.target.id === "ListView" && e.key === "Delete") {
      this.props.removeBatch({ nodes: this.props.selectedNodes });
      this.props.toggleSelections({ selectedNodes: [], clearFirst: true });
    }
  };

  render() {
    return (
      <ScrollContainer
        tabIndex={0}
        style={{ minWidth: 600 }}
        id="ListView"
        onKeyUp={this.onKeyUp}
      >
        {this.props.pdfDir.length > 0 &&
          this.state.nodes.map(node => {
            const { left, top, width, height, scale } = node.data;
            const isSelected = this.props.selectedNodes.includes(node.id);
            const offset = 20;
            return (
              <div
                key={node.id}
                style={{
                  border: isSelected
                    ? "3px solid darkblue"
                    : "3px solid darkgrey",
                  borderRadius: 5,
                  padding: 3,
                  minWidth: width + 200 + 10,
                  margin: 20
                }}
                onClick={this.toggleSelect(node.id)}
              >
                <PdfViewer
                  tabIndex={0}
                  isMainReader={true}
                  pageNumbersToLoad={[node.data.pageNumber]}
                  pdfRootDir={this.props.pdfRootDir}
                  pdfDir={this.props.pdfDir}
                  left={left - offset}
                  top={top - 10}
                  width={width + 200}
                  height={height + 100}
                  scale={scale}
                />
              </div>
            );
          })}
      </ScrollContainer>
    );
  }
}

export default connect(
  mapState,
  mapDispatch
)(ListView);
