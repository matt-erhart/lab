import * as React from "react";
import * as pdfjs from "pdfjs-dist";

const PageCanvasDefaults = {
  props: {
    page: undefined as pdfjs.PDFPageProxy,
    viewport: undefined as pdfjs.PDFPageViewport
  },
  state: {}
};
export default class PageCanvas extends React.Component<
  typeof PageCanvasDefaults.props
> {
  private canvasLayer = React.createRef<HTMLCanvasElement>();
  static defaultProps = PageCanvasDefaults.props;

  async componentDidMount() {
    const { page, viewport } = this.props;
    this.canvasLayer.current.height = viewport.height;
    this.canvasLayer.current.width = viewport.width;
    const canvasContext = this.canvasLayer.current.getContext("2d");
    await page.render({ canvasContext, viewport });
  }

  render() {
    return (
      <canvas
        draggable={false}
        style={{ position: "absolute" }}
        ref={this.canvasLayer}
      />
    );
  }
}
