import * as React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import axios from "axios";

export default class GoogleScholar extends React.Component<any, any> {
  webviewRef = React.createRef<HTMLDivElement>();
  state = {
    res: null
  };
  async componentDidMount() {
    const q = "https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&q=read+wear+edit&btnG="
    const html = await axios.get(q)
    this.setState({res: html})
    //  const divs = this.webviewRef.current.getElementsByTagName("div");
    //  console.log(divs)
    //src="https://scholar.google.com/"
  }

  render() {
    if (!this.state.res) return <div>loading</div>;
    return (
      <div ref={this.webviewRef} style={{ flex: 1 }}>
        {JSON.stringify(this.state.res)}
      </div>
    );
  }
}
