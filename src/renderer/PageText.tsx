import * as React from "react";
import * as pdfjs from "pdfjs-dist";
import styled from "styled-components";
import { TextItemToDisplay, PageOfText } from "./io";

const PageTextContainer = styled("div")<{ height: number; width: number }>`
  position: absolute;
  height: ${props => props.height + "px"};
  width: ${props => props.width + "px"};
`;

class AutoScaledText extends React.Component<{
  textItem: TextItemToDisplay;
  scale: number;
}> {
  divRef = React.createRef<HTMLDivElement>();
  state = {
    scaleX: 1,
    offsetY: 0,
    opacity: 1.0
  };

  computeStyle = (
    textItem: TextItemToDisplay,
    scale: number,
    scaleX: number
  ): React.CSSProperties => {
    return {
      height: "1em",
      fontFamily: `${textItem.fontName}, ${textItem.fallbackFontName}}`,
      fontSize: `${textItem.fontHeight * scale}px`,
      position: "absolute",
      top: textItem.top * scale + 1 + Math.round(textItem.style.ascent * scale),
      left: textItem.left * scale,
      transform: `scaleX(${scaleX})`,
      transformOrigin: "left bottom",
      whiteSpace: "pre",
      color: "transparent",
      // userSelect: "none",
      outline: '1px solid grey'

    };
  };

  componentDidMount() {
    // domWidth will be a bit off on the first go, so we scale based on how big
    // the canvas text fragment is. This lines up the divText+canvas.
    const domWidth = this.divRef.current.getBoundingClientRect()["width"];
    const scaleX = (this.props.textItem.width * this.props.scale) / domWidth;
    if (scaleX !== Infinity) this.setState({ scaleX });
  }

  render() {
    const { textItem, scale } = this.props;

    return (
      <div
        ref={this.divRef}
        style={this.computeStyle(textItem, scale, this.state.scaleX)}
      >
        {this.props.children}
      </div>
    );
  }
}

const PageTextDefaults = {
  props: {
    pageOfText: {} as PageOfText,
    // width: 0,
    // height: 0,
    scale: 1
  },
  state: {}
};

// todo: solent superscript and text out of order even with highlight select
export default class PageText extends React.PureComponent<
  typeof PageTextDefaults.props,
  typeof PageTextDefaults.state
> {
  static defaultProps = PageTextDefaults.props;
  state = PageTextDefaults.state;

  render() {
    const { width, height } = this.props.pageOfText.viewportFlat;
    const { scale } = this.props;
    return (
      <PageTextContainer width={width * scale} height={height * scale}>
        {this.props.pageOfText.text.map((textItem, i) => {
          return (
            <AutoScaledText
              key={i}
              textItem={textItem}
              scale={this.props.scale}
            >
              {textItem.str}
            </AutoScaledText>
          );
        })}
      </PageTextContainer>
    );
  }
}
