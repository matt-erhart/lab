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
const os = require("os");
const path = require("path");
const fs = require("fs");
const { homedir, username } = os.userInfo();
const pdfDir = path.join(homedir, "pdfs");
const pdfNames = fs.readdirSync(pdfDir);

export class App extends React.Component {
  render() {
    return (
      <div style={{ userSelect: "none" }}>
        
        <PdfViewer
          pdfPath={path.join(pdfDir, pdfNames[0])}
          pageNumbersToLoad={[1]}
        />
      </div>
    );
  }
}

const rootEl = document.getElementById("app");
export const render = (Component: typeof App) =>
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    rootEl
  );
