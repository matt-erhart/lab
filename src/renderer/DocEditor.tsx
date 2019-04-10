/**
 * DocEditor.tsx is the larger, more complex version of TextEditor.tsx
 */
// libs
import { Editor } from "slate-react";
import * as React from "react";
import styled from "styled-components";
import Plain from "slate-plain-serializer";
import { oc } from "ts-optchain";

// custom
import { getWordAtCursor } from "./EditorUtils";


/**
 * @class **DocEditor**
 */
const DocEditorDefaults = {
  props: {
    readOnly: false
  },
  state: {
    editorValue: Plain.deserialize("") as Editor["value"],
    wordAtCursor: ""
  }
};
export default class DocEditor extends React.Component<
  typeof DocEditorDefaults.props,
  typeof DocEditorDefaults.state
> {
  static defaultProps = DocEditorDefaults.props;
  state = DocEditorDefaults.state;
  editor: Editor;
  ref = editor => {
    this.editor = editor;
  };

  onChange = change => {
    this.setState({ editorValue: change.value });
    this.getCurrentWord(change);
  };

  getCurrentWord = editor => {
    const anchorOffset = editor.value.selection.getIn(["anchor", "offset"]);
    //@ts-ignore
    const anchorText = oc(editor.value.anchorText).text("");
    const { text, isAfterSpace, isEndOfWord } = getWordAtCursor(
      anchorText,
      anchorOffset
    );
    if (!isEndOfWord) {
      this.setState({ wordAtCursor: "" });
    } else {
      this.setState({ wordAtCursor: text });
    }
  };

  render() {
    return (
      <Editor
        autoFocus
        readOnly={this.props.readOnly}
        ref={this.ref as any}
        spellCheck={false}
        onChange={this.onChange}
        value={this.state.editorValue}
      />
    );
  }
}
