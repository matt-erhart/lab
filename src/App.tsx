import * as React from "react";
import PdfViewer from "./PdfViewer";

export default class App extends React.Component {
  render() {
    return (
      <div>
        <PdfViewer pageNumbersToLoad={[]} />
      </div>
    );
  }
}
