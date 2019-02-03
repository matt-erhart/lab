import * as React from "react";
import PdfViewer from "./PdfViewer";
import { AppContainer } from "react-hot-loader";
import * as ReactDOM from "react-dom";

// const pdfPath = require("./Chunking-TICS.pdf");
// const pdfPath = require("./digitalVsPaper.pdf");
// const pdfPath = require("./Wobbrock-2015.pdf");
// const pdfPath = require("./checklist.pdf");
// const pdfPath = require("./soylent-uist2010.pdf")
// const pdfPath = require("./poverty.pdf");

import styled from "styled-components";
const NavBar = styled.div`
  background-color: #23629f;
  font-size: 30px;
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  flex-flow: row;
  width: 100%;
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
  min-height: 100vh;
  width: 100vw;
  background-color: grey;
  box-sizing: border-box;
  overflow: hidden;
  padding: 8px;
`;

const MainContainer = styled.div`
  overflow: scroll;
  margin-top: 9px;
  box-sizing: border-box;
`;

interface PdfMeta {
  fullPath: string;
  fileName: string;
}

const AppDefaults = {
  props: {},
  state: {
    pdfMeta: [] as PdfMeta[],
    currentPdfPath: "C:\\Users\\merha\\pdfs\\Wobbrock-2015.pdf" as string
  }
};

export class App extends React.Component<any, typeof AppDefaults.state> {
  state = AppDefaults.state;
  componentDidMount() {
    const os = require("os");
    const path = require("path");
    const fs = require("fs");
    const { homedir, username } = os.userInfo();
    const pdfDir = path.join(homedir, "pdfs");
    fs.readdir(pdfDir, (error, pdfNames) => {
      const pdfMeta: PdfMeta[] = pdfNames.map(n => {
        return { fullPath: path.join(pdfDir, n), fileName: n };
      });
      this.setState({ pdfMeta });
    });
  }

  render() {
    const { pdfMeta, currentPdfPath } = this.state;
    return (
      <ViewPortContainer>
        <NavBar>
          {pdfMeta.length > 0 &&
            pdfMeta.map(pdf => {
              return (
                <NavItem
                  key={pdf.fileName}
                  onClick={e => {
                    this.setState({ currentPdfPath: pdf.fullPath });
                  }}
                >
                  {pdf.fileName}
                </NavItem>
              );
            })}
        </NavBar>
        <MainContainer>
          {currentPdfPath.length > 0 && (
            <PdfViewer pdfPath={currentPdfPath} pageNumbersToLoad={[1]} />
          )}
        </MainContainer>
      </ViewPortContainer>
    );
  }
}

document.body.style.margin = "0px";
document.body.style.padding = "0px";
// document.documentElement.style.margin = "0px";
// document.documentElement.style.padding = "0px";
document.body.style.boxSizing = "border-box";
document.body.style.overflow = "hidden";
document.body.style.fontFamily = "Arial";
const rootEl = document.getElementById("app");
export const render = (Component: typeof App) =>
  ReactDOM.render(<Component />, rootEl);

import { hot } from "react-hot-loader/root";

hot(render(App))
