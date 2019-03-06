import { Editor } from "slate-react";
import * as React from "react";
import styled from "styled-components";
import Plain from "slate-plain-serializer";

import { getSelectionRange } from "./utils";
import {getWordAtCursor} from "./TextEditorUtils"

/**
 * @class **TextEditor**
 */
const TextEditorDefaults = {
  props: {},
  state: { editorValue: Plain.deserialize("") as Editor["value"] }
};
export class TextEditor extends React.Component<
  typeof TextEditorDefaults.props,
  typeof TextEditorDefaults.state
> {
  static defaultProps = TextEditorDefaults.props;
  state = TextEditorDefaults.state;
  containerRef = React.createRef<HTMLDivElement>();

  editor: Editor;
  ref = editor => {
    this.editor = editor;
  };

  componentDidMount() {
    // this.edito;
  }

  getCurrentWord = editor => {
    const anchorOffset = editor.value.selection.getIn(["anchor", "offset"]);
    const anchorText = editor.value.anchorText.text;
    const { text, isAfterSpace, isEndOfWord } = getWordAtCursor(
      anchorText,
      anchorOffset
    );
  };

  onChange = change => {
    this.setState({ editorValue: change.value });
    this.getCurrentWord(change);
  };

  render() {
    return (
      <EditorContainer
        ref={this.containerRef}
        // onScroll={this.setRange}
      >
        {this.state.editorValue && (
          <Editor
            autoFocus
            ref={this.editor as any}
            spellCheck={false}
            onChange={this.onChange}
            value={this.state.editorValue}
            //   renderNode={renderNode({ userId, pubId })}
            //   onKeyDown={this.onKeyDown(getInputProps)} //todo backspace
            //   onFocus={this.hideAutocomplete}
            //   onBlur={this.hideAutocomplete}
            style={{ height: "100%" }}
          />
        )}
      </EditorContainer>
    );
  }
}

const EditorContainer = styled.div`
  --margin-size: 20px;
  overflow-y: scroll;
  margin: var(--margin-size);
  outline: 1px solid lightgrey;
  height: calc(100vh - var(--margin-size) * 2);
  font-size: 30px;
`;
