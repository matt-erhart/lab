import * as React from "react";
import * as pdfjs from "pdfjs-dist";
export const isCancelException = error => (
  error.name === 'RenderingCancelledException'
  || error.name === 'PromiseCancelledException'
);

const PageCanvasDefaults = {
  props: {
    page: undefined as pdfjs.PDFPageProxy,
    viewport: undefined as pdfjs.PDFPageViewport
  },
  state: { image: "" as string }
};
export default class PageCanvas extends React.Component<
  typeof PageCanvasDefaults.props,
  typeof PageCanvasDefaults.state
> {
  state = PageCanvasDefaults.state;
  private renderTask;
  private canvasLayer = React.createRef<HTMLCanvasElement>();
  private canvasCrop = React.createRef<HTMLCanvasElement>();
  static defaultProps = PageCanvasDefaults.props;

  renderCanvas = async () => {
    const { page, viewport } = this.props;

    this.canvasLayer.current.height = viewport.height;
    this.canvasLayer.current.width = viewport.width;
    const canvasContext = this.canvasLayer.current.getContext("2d");
    // draw the page into the canvas
    var pageTimestamp = new Date().getTime();

    var renderContext = {
      canvasContext: canvasContext,
      viewport: viewport
    };

    if (this.renderTask && this.renderTask._internalRenderTask.running) {
      this.renderTask.cancel();
    }

    this.renderTask = page.render({ canvasContext, viewport });
    this.renderTask
      .then(() => this.renderTask = null)
      .catch(err => {
        if (isCancelException(err)) {
          return null
        } else {
          throw(err)
        }
      });
  };

  async componentDidMount() {
    await this.renderCanvas();

    // this.getCanvasImage();
  }

  async componentDidUpdate(prevProps) {
    const { viewport } = this.props;
    if (prevProps.viewport !== viewport) {
      await this.renderCanvas();
    }
  }

  getCanvasImage = () => {
    const cropContext = this.canvasCrop.current.getContext("2d");
    const canvasContext = this.canvasLayer.current.getContext("2d");
    const imgData = canvasContext.getImageData(100, 100, 200, 200);
    this.canvasCrop.current.height = imgData.height;
    this.canvasCrop.current.width = imgData.width;
    cropContext.putImageData(imgData, 0, 0);
    const fullQuality = this.canvasCrop.current.toDataURL("image/jpeg", 1.0);
    this.setState({ image: fullQuality });
  };

  render() {
    return (
      <>
        {/* {this.state.image.length > 0 && <img src={this.state.image} alt="" />} */}
        <canvas
          draggable={false}
          style={{ position: "absolute" }}
          ref={this.canvasLayer}
        />
        <canvas
          draggable={false}
          style={{ position: "absolute", display: "none" }}
          ref={this.canvasCrop}
        />
      </>
    );
  }
}
