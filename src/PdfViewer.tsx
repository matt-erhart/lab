import * as React from "react";
import * as pdfjs from "pdfjs-dist";
import { PDFJSStatic } from "pdfjs-dist";
const pdfjsLib: PDFJSStatic = pdfjs as any;
const pdfPath = require("./Wobbrock-2015.pdf");
import { TextLayerBuilder } from "pdfjs-dist/lib/web/text_layer_builder";
require("pdfjs-dist/web/pdf_viewer.css");
import { Suspense } from "react";

const defaultProps = {
  scale: 3,
  page: undefined,
  rotate: undefined
};

class PageCanvas extends React.Component<typeof defaultProps> {
  private canvasLayer = React.createRef<HTMLCanvasElement>();
  static defaultProps = defaultProps;

  async componentDidMount() {
    const { scale, page } = this.props;
    const viewport = page.getViewport(scale);
    this.canvasLayer.current.height = viewport.height;
    this.canvasLayer.current.width = viewport.width;
    const canvasContext = this.canvasLayer.current.getContext("2d");
    await page.render({ canvasContext, viewport });
    const text = await page.getTextContent();
  }

  render() {
    return <canvas ref={this.canvasLayer} />;
  }
}

const PdfViewerDefaults = {
  props: { pageNumbersToLoad: [] as number[] },
  state: {
    scale: 2,
    pages: [] as pdfjs.PDFPageProxy[]
  }
};
export default class PdfViewer extends React.Component<
  typeof PdfViewerDefaults.props,
  typeof PdfViewerDefaults.state
> {
  static defaultProps = PdfViewerDefaults.props;
  state = PdfViewerDefaults.state;

  loadPages = async (
    pdf: pdfjs.PDFDocumentProxy,
    pageNumbersToLoad: number[]
  ) => {
    const allPageNumbers = [...Array(pdf.numPages).keys()].map(x => x + 1);
    const willLoadAllPages = pageNumbersToLoad.length === 0;
    const pageNumPropsOk =
      !willLoadAllPages &&
      Math.min(...pageNumbersToLoad) >= 0 &&
      Math.max(...pageNumbersToLoad) <= Math.max(...allPageNumbers);

    let pageNumbers;
    if (willLoadAllPages) {
      pageNumbers = allPageNumbers;
    } else {
      pageNumbers = pageNumPropsOk ? pageNumbersToLoad : allPageNumbers;
    }

    for (const pageNumber of pageNumbers) {
      const page = await pdf.getPage(pageNumber);
      this.setState(state => {
        return { pages: state.pages.concat(page) };
      });
    }
  };

  async componentDidMount() {
    const pdf = await pdfjsLib.getDocument(pdfPath);
    await this.loadPages(pdf, this.props.pageNumbersToLoad);
  }

  render() {
    const { pages } = this.state;
    const havePages = pages.length > 0;
    return (
      <>
        {havePages &&
          pages.map((page, pageNum) => (
            <PageCanvas key={pageNum} page={page} />
          ))}
      </>
    );
  }
}
