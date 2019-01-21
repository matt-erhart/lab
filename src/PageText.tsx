import * as React from "react";
import * as pdfjs from "pdfjs-dist";
import styled from "styled-components";

export type TextItem = pdfjs.TextContentItem & {
  id: number;
  top: number;
  left: number;
  center: {left: number[], right: number[]};
  fallbackFontName: string;
  style: { fontFamily: string; ascent: number; descent: number };
};

const PageTextContainer = styled("div")<{ height: number; width: number }>`
  position: absolute;
  height: ${props => props.height + "px"};
  width: ${props => props.width + "px"};
  pointer-events: none;
`;

class AutoScaledText extends React.Component<{
  textItem: TextItem;
  scale: number;
}> {
  divRef = React.createRef<HTMLDivElement>();
  state = {
    scaleX: 1,
    offsetY: 0,
    opacity: 1.0
  };

  computeStyle = (
    textItem: TextItem,
    scale: number,
    scaleX: number
  ): React.CSSProperties => {
    return {
      height: "1em",
      fontFamily: `${textItem.fontName}, ${textItem.fallbackFontName}}`,
      fontSize: `${textItem.transform[0] * scale}px`,
      position: "absolute",
      top: textItem.top * scale + 3, // hack yet makes chrome+firefox happy
      left: textItem.left * scale,
      transform: `scaleX(${scaleX}) translateY(${Math.round(
        1 - textItem.style.ascent
      ) * 100}%)`,
      transformOrigin: "left bottom",
      whiteSpace: "pre",
      color: "transparent",
      userSelect: "none"
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
    text: undefined as TextItem[],
    width: 0,
    height: 0,
    scale: 0
  },
  state: {}
};

export default class PageText extends React.PureComponent<
  typeof PageTextDefaults.props,
  typeof PageTextDefaults.state
> {
  static defaultProps = PageTextDefaults.props;
  state = PageTextDefaults.state;

  render() {
    return (
      <PageTextContainer width={this.props.width} height={this.props.height}>
        {this.props.text.map((textItem, i) => {
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
