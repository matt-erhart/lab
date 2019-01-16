import * as React from "react";
import PdfViewer from "./PdfViewer";
import ReactPdfExamples from "./ReactPdfExample";

export default class App extends React.Component {
  render() {
    return (
      <div>
        <PdfViewer pageNumbersToLoad={[1, 2]} />
        {/* <ReactPdfExamples /> */}
      </div>
    );
  }
}
