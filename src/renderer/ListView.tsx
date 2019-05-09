import * as React from "react";
import { iRootState, iDispatch } from "../store/createStore";
import { connect } from "react-redux";
import PdfViewer from "./PdfViewer";
import { ScrollContainer } from "./GraphContainer";
import styled from "styled-components";
import {
  aNode,
  NodeDataTypes,
  AutoGrab,
} from "../store/creators";
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

  static getDerivedStateFromProps(props, state) {  //TODO: filter by autograb and many more 
    const nodes =
      (Object.values(props.nodes) as aNode[]).filter(node => {
        return (
          node.data.type === "pdf.segment.viewbox"
          || node.data.type === "autograb" || node.data.type === "GROBIDMetadata"
          // &&   // Showing all pdf viewbox instead 
          // ("pdfDir" in node.data ? node.data.pdfDir === props.pdfDir : false)
          // ("pdfDir" in node.data ? node.data.pdfDir === props.pdfDir : true)
        );
      }) || [];

    if (props.pdfDir !== state.pdfDir || nodes.length !== state.nodes.length) {  // filtered nodes have a shorter length
      return { pdfDir: props.pdfDir, nodes: nodes.sort((nodeA, nodeB) => (nodeA.id.toString() > nodeB.id.toString() ? 1 : 0)).reverse() };  //sort by paper ID? 
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
        {/* "this is the ScrollContainer" */}
        {this.props.pdfDir.length > 0 &&
          this.state.nodes.map(node => {
            const { left, top, width, height, scale } = node.data;
            const isSelected = this.props.selectedNodes.includes(node.id);
            const offset = 20;
            switch (node.data.type as NodeDataTypes) {
              case "pdf.segment.viewbox":
                // return (
                //   <div
                //     key={node.id}
                //     style={{
                //       border: isSelected
                //         ? "3px solid darkblue"
                //         : "3px solid darkgrey",
                //       borderRadius: 5,
                //       padding: 3,
                //       minWidth: width + 200 + 10,
                //       margin: 20
                //     }}
                //     onClick={this.toggleSelect(node.id)}
                //   >
                //     <PdfViewer
                //       tabIndex={0}
                //       isMainReader={true}
                //       pageNumbersToLoad={[node.data.pageNumber]}
                //       pdfRootDir={this.props.pdfRootDir}
                //       pdfDir={this.props.pdfDir}
                //       left={left - offset}
                //       top={top - 10}
                //       width={width + 200}
                //       height={height + 100}
                //       scale={scale}
                //     />
                //   </div>
                // );
                return (<div></div>)
              case "GROBIDMetadata":
                {
                  const data = (node as AutoGrab).data;
                  var scoredTextList = Object.keys(data).map(function (key, index) {
                    if (key != "type") {
                      return (<li>
                        {key}:{data[key]}
                      </li>)
                    }
                    else{
                      return null
                    }
                  });
                  return (
                    <div
                      key={node.id}
                      style={{
                        backgroundColor: "rgba(0, 151, 19, 0.3)",
                        padding: 5,
                        color: "black",
                        fontWeight: "bold"
                      }}
                      draggable={false}
                    >
                      <b style={{ fontSize: "15px" }}>Metadata from GROBID</b>
                      <span style={{ fontSize: "12px" }}>
                        <ul>
                          {scoredTextList}
                        </ul>

                        {/* {JSON.stringify((node as AutoGrab).data["participant_detail"])} */}
                      </span>
                    </div>
                  );
                }

              case "autograb":
                const data = (node as AutoGrab).data["participant_detail"];
                // const data=node.data['participant_detail'];
                var scoredTextList = data.map(function (d) {
                  return (
                    <li>
                      {d.text}:{d.score}
                    </li>
                  );
                });
                // const scoredTextList=""
                return (
                  <div
                    key={node.id}
                    style={{
                      backgroundColor: "rgba(0, 151, 19, 0.6)",
                      padding: 5,
                      color: "black",
                      fontWeight: "bold"
                    }}
                    draggable={false}
                  >
                    <b style={{ fontSize: "15px" }}>Participant Information for this paper</b>
                    <span style={{ fontSize: "12px" }}>
                      <ul>{scoredTextList}</ul>
                      {/* {JSON.stringify((node as AutoGrab).data["participant_detail"])} */}
                    </span>
                  </div>
                );
              default:
                return null;
            }
          })}
      </ScrollContainer>
    );
  }
}

export default connect(
  mapState,
  mapDispatch
)(ListView);
