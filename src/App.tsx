import * as React from "react";
import PdfViewer from "./PdfViewer";
// const pdfPath = require("./Chunking-TICS.pdf");
// const pdfPath = require("./digitalVsPaper.pdf");
// const pdfPath = require("./Wobbrock-2015.pdf");
// const pdfPath = require("./checklist.pdf");
const pdfPath = require("./soylent-uist2010.pdf")
// const pdfPath = require("./poverty.pdf");

export default class App extends React.Component {
  render() {
    return (
      <div style={{userSelect: 'none'}}>
        <PdfViewer pdfPath={pdfPath} pageNumbersToLoad={[3]} />
      </div>
    );
  }
}
