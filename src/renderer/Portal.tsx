import * as React from "react";
import * as ReactDOM from "react-dom";

// const portalRoot = document.getElementById('portal');

export class Portal extends React.Component<any, any> {
  el = document.createElement("div");

  componentDidMount() {
    document.body.appendChild(this.el);
  }

  componentWillUnmount() {
    document.body.removeChild(this.el);
  }

  render() {
    const { children } = this.props;
    return ReactDOM.createPortal(children, this.el);
  }
}
