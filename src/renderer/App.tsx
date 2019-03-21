import * as React from "react";
import PdfViewer from "./PdfViewer";
import { AppContainer } from "react-hot-loader";
import * as ReactDOM from "react-dom";
import fs = require("fs");
import os = require("os");
import path = require("path");
import { ls, listDirs } from "./io";
import Select from "react-select";
import { Portal } from "./Portal";
import styled from "styled-components";
// import { graph } from "./graph";
import { getPersistor } from "@rematch/persist";
import { PersistGate } from "redux-persist/lib/integration/react";
const persistor = getPersistor(); //prevents initial redux state from takin over
import store, { iRootState, iDispatch } from "../store/createStore";
import { Provider, connect } from "react-redux";
// import PdfNodes from "./PdfNodes";
import { setupDirFromPdfs } from "./io";
import {
  makePdfPublication,
  NodeDataTypes,
  aNode,
  PdfPublication
} from "../store/creators";
import TextEditor from "./TextEditor";
// import BoxMap from "./BoxMap";
import GraphContainer from "./GraphContainer";

const NavBar = styled.div`
  background-color: #23629f;
  font-size: 30px;
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  flex-flow: row;
  width: 100%;
  flex: 0;
  min-height: 50px;
`;

const NavItem = styled.a`
  margin-right: 40px;
  text-align: center;
  vertical-align: middle;
  padding: 8px;
  &:hover {
    background-color: slategray;
    cursor: pointer;
  }
`;

// const ViewPortContainer = styled.div`
//   max-height: 100vh;
//   width: 100vw;
//   background-color: grey;
//   box-sizing: border-box;
//   overflow: hidden;
//   padding: 8px;
//   flex-flow: column;
//   display: flex;
// `;

const ViewPortContainer = styled.div`
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
  flex-flow: column;
  display: flex;
`;

const MainContainer = styled.div`
  margin-top: 9px;
  flex: 1;
  background-color: white;
  overflow: none;
  position: relative;
  display: flex;
`;

const AppDefaults = {
  props: {},
  state: { pdfNodes: [] as PdfPublication[] }
};

const mapState = (state: iRootState) => ({
  pdfDir: state.app.current.pdfDir,
  pdfRootDir: state.app.current.pdfRootDir,
  nodes: state.graph.nodes,
  mainPdfReader: state.app.panels.mainPdfReader
});

const mapDispatch = ({
  graph: { addBatch },
  app: { setMainPdfReader }
}: iDispatch) => ({ addBatch, setMainPdfReader });

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

  const allNodeIds = Object.keys(nodes);
  const newPubs = pdfNodes.filter(pdfNode => !allNodeIds.includes(pdfNode.id));
  return newPubs;
};

// todo rename _App
class _App extends React.Component<connectedProps, typeof AppDefaults.state> {
  state = AppDefaults.state;

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

  //todo delete
  styleFn(provided, state) {
    return { ...provided, minWidth: "200px" };
  }

  setPathInfo = opt => {
    this.props.setMainPdfReader({ pdfDir: opt.label });
  };

  pageNum = [2]; // prevent rerender from array creation
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

    return (
      <ViewPortContainer>
        <NavBar>
          <div style={{ flex: 1 }}>
            <Select
              style={this.styleFn}
              options={fileOptions}
              onChange={this.setPathInfo}
            />
          </div>
        </NavBar>
        <MainContainer>
          {pdfDir.length > 0 && (
            <PdfViewer
            tabIndex={0}
              isMainReader={true}
              key={pdfDir}
              pageNumbersToLoad={[]}
              {...{
                pdfRootDir,
                ...this.props.mainPdfReader
              }}
            />
          )}

          <GraphContainer />
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

// import { D3Force } from "./testD3Force";
import KonvaTest from "./KonvaTest";
import { Tooltip } from "./Tooltip";
// import { TextEditor } from "./TextEditor";/
import { Resizer } from "./Resizer";
class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <ConnectedApp />
        {/* <BoxMap /> */}
        {/* <Resizer /> */}
        {/* <GraphContainer /> */}
      </Provider>
    );
  }
}

document.body.style.margin = "0px";
document.body.style.padding = "0px";
document.body.style.boxSizing = "border-box";
document.body.style.overflow = "hidden";
document.body.style.fontFamily = "Arial";
const rootEl = document.getElementById("app");
export const render = (Component: typeof App) =>
  ReactDOM.render(<Component />, rootEl);

import { hot } from "react-hot-loader/root";
import PortalContainer from "./PortalContainer";

hot(render(App));
