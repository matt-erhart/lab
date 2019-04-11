/**
 * DocEditor.tsx is the larger, more complex version of TextEditor.tsx
 */
// libs
import { Editor } from "slate-react";
import * as React from "react";
import styled from "styled-components";
import Plain from "slate-plain-serializer";
import { oc } from "ts-optchain";
import Lists from "@convertkit/slate-lists";
import Keymap from "@convertkit/slate-keymap";
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined
} from "react-icons/md";
// custom
import { getWordAtCursor } from "./EditorUtils";

const marks = {
  bold: { type: "bold", cmd: "ctrl+b" },
  italic: { type: "italics", cmd: "ctrl+i" },
  underline: { type: "underline", cmd: "ctrl+u" }
};

const plugins = [
  Lists({
    blocks: {
      ordered_list: "ordered-list",
      unordered_list: "unordered-list",
      list_item: "list-item"
    },
    classNames: {
      ordered_list: "ordered-list",
      unordered_list: "unordered-list",
      list_item: "list-item"
    }
  }),
  Keymap({
    [marks.bold.cmd]: (event, editor) => editor.toggleMark(marks.bold.type),
    [marks.italic.cmd]: (event, editor) => editor.toggleMark(marks.italic.type),
    [marks.underline.cmd]: (event, editor) =>
      editor.toggleMark(marks.underline.type),
    // You can also pass a string and it will call the command with that name
    "shift+enter": "softBreak",
    "ctrl+l": (event, editor) => editor.wrapList({ type: "unordered-list" })
  })
];

/**
 * @class **DocEditor**
 */
const DocEditorDefaults = {
  props: {
    readOnly: false
  },
  state: {
    editorValue: Plain.deserialize("some text") as Editor["value"],
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

  hasMark = type => {
    const { editorValue } = this.state;
    return editorValue.activeMarks.some(mark => mark.type === type);
  };

  hasBlock = type => {
    const { editorValue } = this.state;
    return editorValue.blocks.some(node => node.type === type);
  };

  onClickMark = (event, type) => {
    event.preventDefault();
    this.editor.toggleMark(type);
  };

  renderMark = (props, editor, next) => {
    const { children, mark, attributes } = props;

    switch (mark.type) {
      case marks.bold.type:
        return <strong {...attributes}>{children}</strong>;
      case marks.italic.type:
        return <em {...attributes}>{children}</em>;
      case marks.underline.type:
        return <u {...attributes}>{children}</u>;
      default:
        return next();
    }
  };

  renderNode = (props, editor, next) => {
    const { attributes, children, node } = props;

    switch (node.type) {
      case "block-quote":
        return <blockquote {...attributes}>{children}</blockquote>;
      case "bulleted-list":
        return <ul {...attributes}>{children}</ul>;
      case "heading-one":
        return <h1 {...attributes}>{children}</h1>;
      case "heading-two":
        return <h2 {...attributes}>{children}</h2>;
      case "list-item":
        return <li {...attributes}>{children}</li>;
      case "ordered-list":
        return <ol {...attributes}>{children}</ol>;
      case "unordered-list":
      
      console.log(node.toJS())
        return <ul {...attributes}>{children}</ul>;

      default:
        return next();
    }
  };

  renderMarkButton = (type: string, Icon: React.ReactNode) => {
    const isActive = this.state.editorValue.activeMarks.some(
      mark => mark.type === type
    );

    return (
      <Button
        isActive={isActive}
        onMouseDown={event => this.onClickMark(event, type)}
      >
        {Icon}
      </Button>
    );
  };

  iconProps = { size: "25px", style: { verticalAlign: "middle" } };
  onKeyDown = (event, editor, next) => {
    if (event.key === "Tab") {
      event.preventDefault();
      // editor.insertText("\t");
    }
    return next();
  }
  render() {
    return (
      <OuterContainer>
        <Toolbar>
          {this.renderMarkButton(
            marks.bold.type,
            <MdFormatBold {...this.iconProps} />
          )}
          {this.renderMarkButton(
            marks.italic.type,
            <MdFormatItalic {...this.iconProps} />
          )}
          {this.renderMarkButton(
            marks.underline.type,
            <MdFormatUnderlined {...this.iconProps} />
          )}
        </Toolbar>

        <EditorContainer>
          <Editor
            autoFocus
            readOnly={this.props.readOnly}
            ref={this.ref as any}
            spellCheck={false}
            onChange={this.onChange}
            value={this.state.editorValue}
            plugins={plugins}
            style={{ padding: 0, margin: 0, width: "100%", height: "100%" }}
            renderMark={this.renderMark}
            renderNode={this.renderNode}
            onKeyDown={this.onKeyDown}
          />
        </EditorContainer>
      </OuterContainer>
    );
  }
}

const _Button = styled.span<{ isActive: boolean; onMouseDown }>``;
export const Button = styled(_Button)`
  cursor: pointer;
  margin: 0px 5px;
  padding: 0px;
  color: ${props => (props.isActive ? "black" : "darkgrey")};
`;

export const Toolbar = styled.div`
  border: 1px solid lightgrey;
  display: flex;
  align-items: center;
  border-bottom: none;
  padding: 10px;
`;

const OuterContainer = styled.div`
  margin: 0px 12px;
`;

const EditorContainer = styled.div`
  border: 1px solid lightgrey;
  padding: 5px;
  height: 50vh;
`;
