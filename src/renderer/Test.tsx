// css
import "./global.css";

// libs
import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider, connect, useSelector } from "react-redux";
import path = require("path");
import { hot } from "react-hot-loader/root";
import { Pdf, LoadFile } from "./Pdf";
// custom
import store, { iRootState, iDispatch, defaultApp } from "../store/createStore";
import {
  makePdfPublication,
  NodeBase,
  PdfPublication
} from "../store/creators";

import { featureToggles } from "../store/featureToggle";

const ConnectedPdf = props => {
  const dirs = useSelector((state: iRootState) => {
    return {
      dir: state.app.panels.mainPdfReader.pdfDir,
      rootDir: state.app.current.pdfRootDir
    };
  }) as LoadFile;

  if (!!dirs) {
    return <Pdf load={dirs} loadPageNumbers={[1]} />;
  } else {
    return <div>hey</div>;
  }
};

class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <ConnectedPdf />
      </Provider>
    );
  }
}

const rootEl = document.getElementById("app");
export const render = (Component: typeof App) =>
  ReactDOM.render(<Component />, rootEl);

hot(render(App));
