import * as React from "react";

import { PdfPathInfo, iRootState, iDispatch } from "../store/createStore";
import { connect } from "react-redux";
import { Viewbox } from "./db";
import PdfViewer from "./PdfViewer";
/**
 * @class **PdfNodes**
 */
const PdfNodesDefaults = {
  props: { viewboxes: [] as { key: string; attributes: Viewbox }[] },
  state: {}
};
const mapState = (state: iRootState, props: typeof PdfNodesDefaults) => {
  const viewboxes = state.info.nodes.filter(
    n =>
      n.attributes.type === "viewbox/pdf" &&
      n.attributes.pdfPathInfo.dir === state.info.pdfPathInfo.dir
    // todo ts and multi filter util
  );
  return {
    viewboxes: viewboxes,
    pdfPathInfo: state.info.pdfPathInfo
  };
};

const mapDispatch = ({ info: { addNodes, deleteNodes } }: iDispatch) => ({
  deleteNodes
});

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;
class PdfNodes extends React.Component<
  typeof PdfNodesDefaults.props & connectedProps,
  typeof PdfNodesDefaults.state
> {
  static defaultProps = PdfNodesDefaults.props;
  state = PdfNodesDefaults.state;
  render() {
    return (
      <div style={{ maxWidth: "50%", flex: 1, overflowY: 'scroll' }}>
        {this.props.viewboxes.length > 0 &&
          this.props.viewboxes.map(vb => {
            const { left, top, width, height, pageNumber } = vb.attributes;

            return (
              <div
                style={{
                  margin: 10,
                  padding: 10,
                  border: "1px solid grey",
                  borderRadius: "5px",
                  backgroundColor: 'lightgrey'
                }}
              >
                <PdfViewer
                  key={vb.key}
                  pathInfo={this.props.pdfPathInfo}
                  pageNumbersToLoad={[pageNumber]}
                  viewBox={{
                    left: left - 40,
                    top: top - 40,
                    height: height + 80,
                    width: "100%"
                  }}
                />
              </div>
            );
          })}
      </div>
    );
  }
}

export default connect(
  mapState,
  mapDispatch
)(PdfNodes);
