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

function compare(nodeA: any, nodeB: any) {
  // console.log("Inside compare"+a.id)
  // console.log(b.id)
  if (nodeA.id.toString() < nodeB.id.toString()) {
    return -1;
  }
  if (nodeA.id.toString() > nodeB.id.toString()) {
    return 1;
  }
  return 0;
}

function keySort(keyA: string, keyB: string) {
  if (keyA == "title")
    return 1;
  return 0;
}

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

      return {
        pdfDir: props.pdfDir,
        nodes: nodes.sort((nodeA, nodeB) => (nodeA.id > nodeB.id ? 1 : 0))
      };  //sort by paper ID? 
    } else {
      return null;
    }
  }

  // toggleSelect = id => e => {
  //   this.props.toggleSelections({ selectedNodes: [id] });
  // };

  // onKeyUp = e => {
  //   if (e.target.id === "ListView" && e.key === "Delete") {
  //     this.props.removeBatch({ nodes: this.props.selectedNodes });
  //     this.props.toggleSelections({ selectedNodes: [], clearFirst: true });
  //   }
  // };

  render() {
    // const sortedArray = this.state.nodes.sort(compare)
    // // nodeA, nodeB) => (nodeA['id'].toString() > nodeB['id'].toString() ? 1 : 0)
    // console.log(sortedArray.map(node => {
    //   return node['id']
    // }))
    return (
      <ScrollContainer
        tabIndex={0}
        style={{ minWidth: 600 }}
        id="ListView"
      // onKeyUp={this.onKeyUp}
      >
        {/* "this is the ScrollContainer" */}

        {this.props.pdfDir.length > 0 &&
          this.state.nodes.sort(compare).map(node => {
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
                  var scoredTextList = Object.keys(data).sort(keySort).map(function (key, index) {
                    if (key != "type") {
                      let value;
                      if (Array.isArray(data[key])) {
                        //  if (typeof (value) == typeof(""))
                        value = data[key].join(", ");
                      } else if (data[key] == "") {
                        value = "null"
                      }
                      else {
                        value = data[key];
                      }
                      return (<li>
                        {key}: {value}
                      </li>)
                    }
                    else {
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
                      {/* {node.id} */}
                      <b style={{ fontSize: "15px" }}>Paper metadata </b>
                      {/* from GROBID */}
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
                      {/* Confidence {d.score.toFixed(3)}:<br /> */}
                      {d.text}
                    </li>
                  );
                });
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
                    {/* {node.id} */}
                    <b style={{ fontSize: "15px" }}>User study (e.g. participant information) for the above paper</b>
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
