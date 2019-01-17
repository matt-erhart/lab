import * as React from "react";
import * as pdfjs from "pdfjs-dist";
import styled from "styled-components";

// some example mouse coordinates
// const TL = {x: 313, y: 148.3333282470703}
// const BR = {x: 557, y: 200.3333282470703}

// const text = adjustedTextContent.filter(tc => {
//   const textX = tc.viewportAdjustedTrans[4]
//   const textY = tc.viewportAdjustedTrans[5]
//   const yInRange = textY > TL.y && textY < BR.y
//   const xInRange = textX > TL.x && textX < BR.x
//   return yInRange && xInRange
// })

const PageSvgDefaults = {
    props: { width: 0, height: 0 },
    state: { selectionRect: { x: 0, y: 0 } }
  };
  export default class PageSvg extends React.Component<
    typeof PageSvgDefaults.props,
    typeof PageSvgDefaults.state
  > {
    static defaultProps = PageSvgDefaults.props;
    state = PageSvgDefaults.state;
    svgRef = React.createRef<SVGSVGElement>();
    render() {
      const { width, height } = this.props;
      return (
        <svg
          ref={this.svgRef}
          style={{ position: "absolute" }}
          width={width}
          height={height}
          onClick={e => {
            const bounding = this.svgRef.current.getBoundingClientRect();
            const x = e.clientX - bounding.left;
            const y = e.clientY - bounding.top;
            this.setState({ selectionRect: { x, y } });
          }}
        >
          <rect
            width="300"
            height="100"
            x={this.state.selectionRect.x}
            y={this.state.selectionRect.y}
            style={{ stroke: "black" }}
          />
        </svg>
      );
    }
  }