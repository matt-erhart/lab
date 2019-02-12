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
import store, {
  PdfPathInfo,
  iRootState,
  iDispatch
} from "../store/createStore";
import { Provider, connect } from "react-redux";
import PdfNodes from "./PdfNodes";
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

const AppDefaults = {
  props: {},
  state: {
    pathInfo: [] as PdfPathInfo[],
    currentPathInfo: {} as PdfPathInfo
  }
};

// import {pubs} from '@src/constants/pubs'
const mapState = (state: iRootState) => ({
  pdfPathInfo: state.info.pdfPathInfo
});

const mapDispatch = ({ info: { updateState } }: iDispatch) => ({
  updateState
});

type connectedProps = ReturnType<typeof mapState> &
  ReturnType<typeof mapDispatch>;

class _App extends React.Component<connectedProps, typeof AppDefaults.state> {
  state = AppDefaults.state;

  async componentDidMount() {
    // graph.on("nodeAdded", this.callback);

    // this.mainContainerRef.current.scrollTo(107.14, 490);
    const { homedir, username } = os.userInfo();
    const pdfRootDir = path.join(homedir, "pdfs");
    const pdfDirs = await listDirs(pdfRootDir);

    const pathInfo = pdfDirs.map(dir => {
      const normDir = path.normalize(dir);
      const pathParts = normDir.split(path.sep);
      const _fileName = pathParts[pathParts.length - 1];
      const fileName =
        _fileName === "" ? pathParts[pathParts.length - 2] : _fileName;
      return {
        pdfPath: path.join(normDir, fileName) + ".pdf",
        pdfName: fileName + ".pdf",
        dir: normDir
      };
    });

    this.setState({ pathInfo, currentPathInfo: pathInfo[0] });
    this.props.updateState({ pdfPathInfo: pathInfo[0] });
  }
  componentWillUnmount() {
    // graph.removeListener("nodeAdded", this.callback);
  }

  styleFn(provided, state) {
    return { ...provided, minWidth: "200px" };
  }

  setPathInfo = opt => {
    this.setState({ currentPathInfo: opt.value });
    this.props.updateState({ pdfPathInfo: opt.value });
  };

  render() {
    const { currentPathInfo, pathInfo } = this.state;
    const fileOptions = pathInfo.map(info => ({
      value: info,
      label: info.pdfName.replace(".pdf", "")
    }));

    return (
      <ViewPortContainer>
        <NavBar>
          <div style={{ flex: 1 }}>
            {pathInfo.length > 0 && (
              <Select
                style={this.styleFn}
                options={fileOptions}
                onChange={this.setPathInfo}
              />
            )}
          </div>
        </NavBar>
        <MainContainer>
          {Object.keys(currentPathInfo).length > 0 && (
            <PdfViewer
              pathInfo={currentPathInfo}
              pageNumbersToLoad={[]}
              viewBox={{
                left: 107.148 - 20,
                top: 490.84180000000083 - 20,
                width: "50%",
                height: "100%"
              }}
            />
          )}
          <PdfNodes />
        </MainContainer>
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
