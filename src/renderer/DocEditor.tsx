/**
 * DocEditor.tsx is the larger, more complex version of TextEditor.tsx
 */

import * as React from "react";

/**
 * @class **DocEditor**
 */
const DocEditorDefaults = {
  props: {},
  state: {}
};
export class DocEditor extends React.Component<
  typeof DocEditorDefaults.props,
  typeof DocEditorDefaults.state
> {
  static defaultProps = DocEditorDefaults.props;
  state = DocEditorDefaults.state;
  render() {
    return null;
  }
}
