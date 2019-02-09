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

export interface PathInfo {
  pdfPath: string;
  pdfName: string;
  dir: string;
}

const AppDefaults = {
  props: {},
  state: {
    pathInfo: [] as PathInfo[],
    currentPathInfo: {} as PathInfo
  }
};

export class App extends React.Component<any, typeof AppDefaults.state> {
  state = AppDefaults.state;
  async componentDidMount() {
    
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
  }

  styleFn(provided, state) {
    return { ...provided, minWidth: "200px" };
  }

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
                onChange={opt => {
                  this.setState({ currentPathInfo: opt.value });
                }}
              />
            )}
          </div>
        </NavBar>
        <MainContainer>
          {Object.keys(currentPathInfo).length > 0 && (
            <PdfViewer
              pathInfo={currentPathInfo}
              pageNumbersToLoad={[1, 2]}
              viewBox={{
                left: 107.148 - 20,
                top: 490.84180000000083 - 20,
                width: "50%",
                height: "100%"
              }}
            />
          )}
        </MainContainer>
      </ViewPortContainer>
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
