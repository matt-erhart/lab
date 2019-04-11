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
  MdFormatUnderlined,
  MdLooksOne,
  MdLooksTwo,
  MdLooks3,
  MdFormatListNumbered,
  MdFormatListBulleted
} from "react-icons/md";
import Slate from "slate";

// custom
import { getWordAtCursor } from "./EditorUtils";

type SlateTypes =
  | "bold"
  | "italics"
  | "underline"
  | "ordered-list"
  | "unordered-list"
  | "list-item-child"
  | "list-item"
  | "paragraph";
const defaultNode = "paragraph" as SlateTypes;

const marks = {
  bold: { type: "bold" as SlateTypes, cmd: "ctrl+b" },
  italic: { type: "italics" as SlateTypes, cmd: "ctrl+i" },
  underline: { type: "underline" as SlateTypes, cmd: "ctrl+u" }
};

// todo util
const checkListType = (editor, type: "ordered-list" | "unordered-list") => {
  if (!editor) return { isList: false, isType: false };
  const isList = editor.value.blocks.some(
    node => node.type === ("list-item-child" as SlateTypes)
  );

  const isType = editor.value.blocks.some(block => {
    return !!editor.value.document.getClosest(
      block.key,
      parent => parent.type === type
    );
  });
  return { isList, isType };
};

const toggleList = (editor, type: "ordered-list" | "unordered-list") => {
  const { isList, isType } = checkListType(editor, type);
  if (!isList) {
    editor.wrapList({ type });
  } else {
    editor.unwrapList();
    if (!isType) {
      editor.wrapList({
        type: type === "ordered-list" ? "ordered-list" : "unordered-list"
      });
    }
  }
};

const plugins = [
  Lists({
    blocks: {
      ordered_list: "ordered-list" as SlateTypes,
      unordered_list: "unordered-list" as SlateTypes,
      list_item: "list-item" as SlateTypes
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
    "mod+l": (event, editor: Editor) => toggleList(editor, "unordered-list"),
    "mod+o": (event, editor: Editor) => toggleList(editor, "ordered-list")
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
    wordAtCursor: "",
    fontSize: 16
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

  componentDidMount() {}

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
        return <ul {...attributes}>{children}</ul>;

      default:
        return next();
    }
  };

  renderMarkButton = (type: SlateTypes, Icon: React.ReactNode, title = "") => {
    const isActive = this.state.editorValue.activeMarks.some(
      mark => mark.type === type
    );

    return (
      <Button
        title={title}
        isActive={isActive}
        onMouseDown={event => this.onClickMark(event, type)}
      >
        {Icon}
      </Button>
    );
  };

  renderBlockButton = (type: string, Icon: React.ReactNode, title = "") => {
    const { isList, isType } = checkListType(this.editor, type);
    return (
      <Button
        title={title}
        isActive={isType}
        onMouseDown={event => toggleList(this.editor, type)}
      >
        {Icon}
      </Button>
    );
  };

  MakeButtons = () => {
    const iconProps = { size: "25px", style: { verticalAlign: "middle" } };
    return [
      this.renderMarkButton(marks.bold.type, <MdFormatBold {...iconProps} />, marks.bold.cmd),
      this.renderMarkButton(
        marks.italic.type,
        <MdFormatItalic {...iconProps} />,
        marks.italic.cmd
      ),
      this.renderMarkButton(
        marks.underline.type,
        <MdFormatUnderlined {...iconProps} />,
        marks.underline.cmd
      ),
      this.renderBlockButton(
        "ordered-list" as SlateTypes,
        <MdFormatListNumbered {...iconProps} />,
        'ctrl-o'
      ),
      this.renderBlockButton(
        "unordered-list" as SlateTypes,
        <MdFormatListBulleted {...iconProps} />,
        'ctrl-l'
      )
    ];
  };

  changeFontSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ fontSize: e.target.value });
  };

  onKeyDown = (event, editor, next) => {
    if (event.key === "Tab") {
      event.preventDefault();
      // editor.insertText("\t");
    }
    return next();
  };
  render() {
    return (
      <OuterContainer>
        <Toolbar>
          {" "}
          {this.MakeButtons()}{" "}
          <FontSizeInput
            type="number"
            min={2}
            max={48}
            value={this.state.fontSize}
            onChange={this.changeFontSize}
            title="Base Font Size"
          />
        </Toolbar>

        <EditorContainer fontSize={this.state.fontSize}>
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

const FontSizeInput = styled.input`
  width: 1.8em;
  height: 1.8em;
  font-size: 1.3em;
  appearance: textfield;
  text-align: center;
  font-weight: bold;
  color: darkgrey;
  border: none;
`;

const _EditorContainer = styled.div<{ fontSize: number }>``;
const EditorContainer = styled(_EditorContainer)`
  border: 1px solid lightgrey;
  padding: 5px;
  height: 50vh;
  font-size: ${p => p.fontSize}px;
`;
