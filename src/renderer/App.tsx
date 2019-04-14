// css
import "./global.css";

// libs
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider, connect } from "react-redux";
import styled from "styled-components";
import path = require("path");
import { hot } from "react-hot-loader/root";
import Select from "react-select";

// custom
import store, { iRootState, iDispatch, defaultApp } from "../store/createStore";
import PdfViewer from "./PdfViewer";
import { setupDirFromPdfs } from "./io";
import ListView from "./ListView";
import {
  makePdfPublication,
  makeAutograbNode,
  aNode,
  PdfPublication
} from "../store/creators";
import GraphContainer from "./GraphContainer";
import { ResizeDivider } from "./ResizeDivider";
import PortalContainer from "./PortalContainer";
import { mData } from "./rx";
import DocEditor from "./DocEditor";
import console = require("console");

const NavBar = styled.div`
  font-size: 30px;
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  flex-flow: row;

  flex: 0;
  margin: 1px;
`;

const ViewPortContainer = styled.div`
  --border-size: 1;
  max-height: 100vh;
  border: var(--border-size) solid lightgrey;
  border-radius: 5px;
  font-size: 30px;
  overflow: none;
  flex-flow: column;
  display: flex;
`;

const MainContainer = styled.div`
  flex: 1 2;
  background-color: white;
  overflow: none;
  position: relative;
  display: flex;
  margin: 15px;
`;

const AppDefaults = {
  props: {},
  state: { pdfNodes: [] as PdfPublication[] }
};
//mapState is a convention in Redux
const mapState = (state: iRootState) => ({
  pdfDir: state.app.panels.mainPdfReader.pdfDir, //more or less an alias
  pdfRootDir: state.app.current.pdfRootDir,
  nodes: state.graph.nodes,
  mainPdfReader: state.app.panels.mainPdfReader,
  rightPanel: state.app.panels.rightPanel
});

// set component event/function as shortcut alias, affiliated to this.props
const mapDispatch = ({
  graph: { addBatch },
  app: { setMainPdfReader, setRightPanel }
}: iDispatch) => ({ addBatch, setMainPdfReader, setRightPanel });

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

const processNewPdfs = async (pdfRootDir, nodes) => {
  const pdfDirs = await setupDirFromPdfs(pdfRootDir);

  const pdfNodes = pdfDirs.map((dir, ix) => {
    const normDir = path.normalize(dir);
    const pathParts = normDir.split(path.sep);
    const fileName = pathParts[pathParts.length - 1];
    const pdfDir = fileName === "" ? pathParts[pathParts.length - 2] : fileName;

    return makePdfPublication(
      pdfDir,
      { pdfDir },
      { x: 50 + ix + Math.random() * 100, y: 50 + ix * Math.random() * 100 }
    );
  });

  const autograbNodes = pdfDirs.map((dir, ix) => {
    return makeAutograbNode(
      dir,
      { dir },
      { x: 50 + ix + Math.random() * 100, y: 50 + ix * Math.random() * 100 }
    );
  });

  const allNodeIds = Object.keys(nodes);
  
  const newPubs = pdfNodes.filter(pdfNode => !allNodeIds.includes(pdfNode.id)); //filter out nodes that exists
  // const newAutograbs = autograbNodes.filter(autograbNode => !allNodeIds.includes(autograbNode.id)); //filter out nodes that exists
  // const newNodes = newPubs + autograbNodes
  return newPubs.concat(autograbNodes);
};

type rightPanelName = typeof defaultApp.panels.rightPanel;
// todo rename _App
class _App extends React.Component<connectedProps, typeof AppDefaults.state> {
  state = AppDefaults.state;
  keyback = (e: KeyboardEvent) => {
    const altAndKeyToCmd = {
      "1": "graphContainer" as rightPanelName,
      "2": "listview" as rightPanelName,
      "3": "synthesisOutlineEditor" as rightPanelName
      // "3": "docEditor" as rightPanelName
    };
    if (e.altKey && Object.keys(altAndKeyToCmd).includes(e.key)) {
      this.props.setRightPanel(altAndKeyToCmd[e.key]);
    }
  };
  async componentDidMount() {
    const newPubs = await processNewPdfs(
      this.props.pdfRootDir,
      this.props.nodes
    );

    if (newPubs.length > 0) {
      this.props.addBatch({ nodes: newPubs });
      if (this.props.pdfDir === "")
        this.props.setMainPdfReader({ pdfDir: newPubs[0].id });
    }

    window.addEventListener("keyup", this.keyback);
  }

  componentWillUnmount() {
    window.removeEventListener("keyup", this.keyback);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    // todo switch to patches
    const pdfNodes = (Object.values(nextProps.nodes) as aNode[]).filter(
      n => n.data.type === "pdf.publication"
    );
    let wasUpdated = false;
    if (pdfNodes.length !== prevState.pdfNodes.length) {
      wasUpdated = true;
    } else {
      pdfNodes.forEach((node, ix) => {
        if (node.meta.timeUpdated !== prevState.pdfNodes[ix].meta.timeUpdated) {
          wasUpdated = true;
        }
      });
    }
    if (wasUpdated) {
      return { pdfNodes };
    } else {
      return null;
    }
  }

  styleFn(provided, state) {
    return { ...provided, minWidth: "5%", height: 5 };
  }

  setPathInfo = opt => {
    this.props.setMainPdfReader({ pdfDir: opt.label });
  };

  //todo mdata
  onResizeDivider = (mouseData: mData) => {
    const { width } = this.props.mainPdfReader;
    // todo use bounding box on ref instead of '15'
    this.props.setMainPdfReader({ width: mouseData.clientX - 15 });
  };

  renderRightPanel = (panelName: rightPanelName) => {
    switch (panelName) {
      case "graphContainer":
        return <GraphContainer />;
      case "listview":
        return <ListView />;
      case "synthesisOutlineEditor":
        //         case "docEditor":
        return <DocEditor />;
      default:
        return <div>alt-1 | alt-2 | alt-3</div>;
    }
  };

  render() {
    const { pdfRootDir, pdfDir } = this.props;
    const { pdfNodes } = this.state;
    const fileOptions = pdfNodes.map(node => ({
      value: node,
      label: node.data.pdfDir
    }));

    if (pdfNodes.length === 0) {
      return <h2>Add some pdfs to your selected folder and view->reload</h2>;
    }

    // return <DocEditor />;

    return (
      <ViewPortContainer>
        <div style={{ flex: 1, padding: 5, height: 50, margin: 15 }}>
          <Select
            // style={this.styleFn}
            options={fileOptions}
            onChange={this.setPathInfo}
          />
        </div>
        <MainContainer>
          {pdfDir.length > 0 && (
            <div
              style={{
                border: "4px solid grey",
                borderRadius: 5,
                // padding: 3,
                minWidth: this.props.mainPdfReader.width + 3
              }}
            >
              <PdfViewer
                tabIndex={0}
                isMainReader={true}
                key={pdfDir}
                pageNumbersToLoad={[]}
                {...{
                  pdfRootDir,
                  ...this.props.mainPdfReader,
                  height: "100%"
                }}
              />
            </div>
          )}
          <ResizeDivider onTransforming={this.onResizeDivider} />
          {this.renderRightPanel(this.props.rightPanel)}
        </MainContainer>
        <PortalContainer />
      </ViewPortContainer>
    );
  }
}
const ConnectedApp = connect(
  mapState,
  mapDispatch
)(_App);

class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <ConnectedApp />
      </Provider>
    );
  }
}

const rootEl = document.getElementById("app");
export const render = (Component: typeof App) =>
  ReactDOM.render(<Component />, rootEl);

hot(render(App));
