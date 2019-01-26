import * as React from "react";
import {Image} from './PdfViewer'

/**
 * @class **PageImages**
 */
const PageImagesDefaults = {
  props: {images: [] as Image[]},
  state: {}
};
export class PageImages extends React.Component<
  typeof PageImagesDefaults.props,
  typeof PageImagesDefaults.state
> {
  static defaultProps = PageImagesDefaults.props;
  state = PageImagesDefaults.state;
  render() {
    return null;
  }
}
