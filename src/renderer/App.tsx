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

const ViewPortContainer = styled.div`
  max-height: 100vh;
  width: 100vw;
  background-color: grey;
  box-sizing: border-box;
  overflow: hidden;
  padding: 8px;
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
const { homedir, username } = os.userInfo();
const pdfRootDir = path.join(homedir, "pdfs");
const AppDefaults = {
  props: {},
  state: { pdfNodes: [] as PdfPublication[] }
};

// import {pubs} from '@src/constants/pubs'
const mapState = (state: iRootState) => ({
  pdfDir: state.app.current.pdfDir,
  pdfRootDir: state.app.current.pdfRootDir,
  nodes: state.graph.nodes
});

const mapDispatch = ({
  graph: { addBatch },
  app: { setCurrent }
}: iDispatch) => ({ addBatch, setCurrent });

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

class _App extends React.Component<connectedProps, typeof AppDefaults.state> {
  state = AppDefaults.state;

  async componentDidMount() {
    const pdfDirs = await setupDirFromPdfs(this.props.pdfRootDir);
    const pdfNodes = pdfDirs.map((dir, ix) => {
      const normDir = path.normalize(dir);
      const pathParts = normDir.split(path.sep);
      const _fileName = pathParts[pathParts.length - 1];
      const pdfDir =
        _fileName === "" ? pathParts[pathParts.length - 2] : _fileName;

      return makePdfPublication(
        pdfDir,
        { pdfDir },
        { x: ix + Math.random() * 100, y: 50 + ix * Math.random() * 100 }
      );
    });
    const allNodeIds = Object.keys(this.props.nodes);
    const newPubs = pdfNodes.filter(
      pdfNode => !allNodeIds.includes(pdfNode.id)
    );
    if (newPubs.length > 0) {
      this.props.addBatch({ nodes: newPubs });
      if (this.props.pdfDir === "")
        this.props.setCurrent({ pdfDir: newPubs[0].id });
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

  componentWillUnmount() {}

  styleFn(provided, state) {
    return { ...provided, minWidth: "200px" };
  }

  setPathInfo = opt => {
    this.props.setCurrent({ pdfDir: opt.label });
  };

  render() {
    const { pdfRootDir, pdfDir } = this.props;
    const { pdfNodes } = this.state;
    const fileOptions = pdfNodes.map(node => ({
      value: node,
      label: node.data.pdfDir
    }));

    return (
      <ViewPortContainer>
        <NavBar>
          <div style={{ flex: 1 }}>
            {pdfNodes.length > 0 && (
              <Select
                style={this.styleFn}
                options={fileOptions}
                onChange={this.setPathInfo}
              />
            )}
          </div>
        </NavBar>
        <MainContainer>
          {pdfDir.length > 0 && (
            <PdfViewer
              pathInfo={{ pdfRootDir, pdfDir }}
              pageNumbersToLoad={[1]}
              viewBox={{
                left: 107.148 - 20,
                top: 490.84180000000083 - 20,
                width: "50%",
                height: "100%",
                scale: 2
              }}
            />
          )}
          <KonvaTest />
        </MainContainer>
      </ViewPortContainer>
    );
  }
}
const ConnectedApp = connect(
  mapState,
  mapDispatch
)(_App);

import KonvaTest from "./KonvaTest";
import { Tooltip } from "./Tooltip";
class App extends React.Component {
  refEl = React.createRef();
  state = { x: NaN, y: NaN };
  render() {
    return (
      <Provider store={store}>
        {/* <ConnectedApp /> */}
        <div
          style={{
            width: "100vw",
            height: "100vh",
            backgroundColor: "lightgrey"
          }}
          onClick={e => {
            this.setState({ x: e.screenX, y: e.screenY });
          }}
        >
          stuff
        </div>
        <Tooltip mouseX={this.state.x} mouseY={this.state.y} />
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

hot(render(App));
