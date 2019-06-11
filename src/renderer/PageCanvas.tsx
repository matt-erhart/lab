import * as React from "react";
import * as pdfjs from "pdfjs-dist";
export const isCancelException = error =>
  error.name === "RenderingCancelledException" ||
  error.name === "PromiseCancelledException";
import { from, defer } from "rxjs";
import { take, debounceTime, tap } from "rxjs/operators";
import { Subject } from "rxjs";

const PageCanvasDefaults = {
  props: {
    id: "",
    page: undefined as pdfjs.PDFPageProxy,
    viewport: undefined as pdfjs.PDFPageViewport,
    scale: 1
  },
  state: { image: "" as string, isRendering: true }
};
export default class PageCanvas extends React.Component<
  typeof PageCanvasDefaults.props,
  typeof PageCanvasDefaults.state
> {
  state = PageCanvasDefaults.state;
  private renderTask;
  private renderScale1Task;
  private canvasLayer = React.createRef<HTMLCanvasElement>();
  private canvasScale1 = React.createRef<HTMLCanvasElement>();
  // todo perf: use a ref callback to set the ref and then hide
  private canvasCrop = React.createRef<HTMLCanvasElement>();
  static defaultProps = PageCanvasDefaults.props;
  private subjectRendering = new Subject();

  scale1Canvas = async () => {
    const { page } = this.props;
    const viewport = page.getViewport(1);
    this.canvasScale1.current.height = viewport.height;
    this.canvasScale1.current.width = viewport.width;
    const canvasContext = this.canvasScale1.current.getContext("2d");
    if (
      this.renderScale1Task &&
      this.renderScale1Task._internalRenderTask.running
    ) {
      this.renderScale1Task.cancel();
    }

    this.renderScale1Task = page.render({ canvasContext, viewport });
    this.renderScale1Task
      .then(() => {
        this.renderScale1Task = null;
      })
      .catch(err => {
        if (isCancelException(err)) {
          return null;
        } else {
          throw err;
        }
      });
  };

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
      .then(() => {
        this.renderTask = null;
        if (!!this.canvasLayer.current)
          this.canvasLayer.current.style.opacity = "1";
        this.setState({ isRendering: false });
      })
      .catch(err => {
        if (isCancelException(err)) {
          return null;
        } else {
          throw err;
        }
      });
  };
  subscription;
  async componentDidMount() {
    // if no render requests for 100ms, then call the func to render = smooth scroll
    this.subscription = this.subjectRendering
      .pipe(
        debounceTime(50),
        tap(async () => {
          this.setState({ isRendering: true });
          await this.renderCanvas();
        })
      )
      .subscribe(()=> {
        console.log('sub render');
      });
    this.scale1Canvas();
    this.renderCanvas();

    this.setState({ isRendering: false });
  }

  componentWillUnmount() {
    this.subscription.unsubscribe();
  }

  rxTest = defer(this.renderCanvas).pipe(debounceTime(2200));

  async componentDidUpdate(prevProps) {
    const { viewport, page } = this.props;
    const figureprint1 = page.transport.pdfDocument.pdfInfo.fingerprint;
    const figureprint2 =
      prevProps.page.transport.pdfDocument.pdfInfo.fingerprint;

    if (prevProps.viewport !== viewport) {
      if (!!this.canvasLayer.current)
        this.canvasLayer.current.style.opacity = "0";
      this.subjectRendering.next("request render"); // so we can debounce rendering on zoom
    }

    if (figureprint1 !== figureprint2) {
      this.scale1Canvas();
      this.subjectRendering.next("request render"); // so we can debounce rendering on zoom

    }
  }

  shouldComponentUpdate(prevProps, prevState) {
    const { viewport, page } = this.props;
    const scaleChange = prevProps.scale !== this.props.scale;
    const viewportChangeHeight =
      prevProps.viewport.height !== this.props.viewport.height;
    const viewportChangeWidth =
      prevProps.viewport.width !== this.props.viewport.width;
      const figureprint1 = this.props.page.transport.pdfDocument.pdfInfo.fingerprint;
    const figureprint2 =
      prevProps.page.transport.pdfDocument.pdfInfo.fingerprint;
      const newPdf = figureprint1 !== figureprint2

    // const renderDone = !this.state.isRendering;
    // const justFinishedRender = prevState.isRendering;
    return scaleChange || viewportChangeHeight || viewportChangeWidth || newPdf
  }

  // getCanvasImage = () => {
  //   const cropContext = this.canvasCrop.current.getContext("2d");
  //   const canvasContext = this.canvasLayer.current.getContext("2d");
  //   const imgData = canvasContext.getImageData(100, 100, 200, 200);
  //   this.canvasCrop.current.height = imgData.height;
  //   this.canvasCrop.current.width = imgData.width;
  //   cropContext.putImageData(imgData, 0, 0);
  //   const fullQuality = this.canvasCrop.current.toDataURL("image/jpeg", 1.0);
  //   this.setState({ image: fullQuality });
  // };
  style = (props): React.CSSProperties => ({
    position: "absolute",
    transformOrigin: "top left",
    transform: `scale(${props.scale})`
  });
  render() {
    
    // todo
    return (
      <>
        {/* {this.state.image.length > 0 && <img src={this.state.image} alt="" />} */}
        <canvas
          draggable={false}
          style={{
            position: "absolute",
            transformOrigin: "top left",
            zIndex: 2
          }}
          ref={this.canvasLayer}
        />
        <canvas
          draggable={false}
          style={this.style(this.props)}
          ref={this.canvasScale1}
        />
      </>
    );
  }
}
