import { getRegexIndexes } from "./utils";
import { oc } from "ts-optchain";
import uuidv1 from "uuid/v1";
import { Value } from "slate";

export const initKeySafeSlate = () => {
  const val = Value.fromJSON({
    document: {
      key: uuidv1(), // prevent conflicts with multiple instances of slate
      nodes: [
        {
          object: "block",
          type: "paragraph",
          nodes: [
            {
              object: "text",
              leaves: [{ text: "" }]
            }
          ]
        }
      ]
    }
  });
  return val;
};

// todo use this
function getCmd(value, regex = /@(\S*)$/) {
  if (!value.startText) {
    return null;
  }
  const startOffset = value.selection.start.offset;
  const textBefore = value.startText.text.slice(0, startOffset);
  const result = regex.exec(textBefore);
  return result == null ? null : result[1];
}

export function getWordAtCursor(text: string, cursorLocInText: number) {
  // finds space character to left/right and the text in between
  const spaceIndexes: number[] = getRegexIndexes(text, /\s/g);
  const isIndexSpace = spaceIndexes.includes(cursorLocInText - 1);
  const ix: number = isIndexSpace ? cursorLocInText : cursorLocInText - 1;
  let leftSpaceIx = 0;
  let rightSpaceIx = text.length;
  for (let index of spaceIndexes) {
    if (index <= cursorLocInText) leftSpaceIx = index;
    if (index >= cursorLocInText) {
      rightSpaceIx = index;
      break;
    }
  }
  const isAfterSpace = (text[cursorLocInText - 1] || " ") === " ";
  const isEndOfWord = (text[cursorLocInText] || " ") === " " && !isAfterSpace;

  const firstWord = leftSpaceIx === rightSpaceIx;
  return {
    isEndOfWord,
    isAfterSpace,
    text: text.slice(firstWord ? 0 : leftSpaceIx, rightSpaceIx).trim()
  };
}

export const onSlash = (event, editor, next) => {
  const { value } = editor;
  const { selection } = value;
  if (selection.isExpanded) return next();
  const { startBlock } = value;
  const { start } = selection;
  const charBeforeSlash = startBlock.text[start.offset - 1] || " ";
  if ([" ", "/"].includes(charBeforeSlash)) {
    return true;
  } else {
    return false;
  }
  return next();
};

function fuzzyMatch(text, abstractions) {
  var results = fuzzy.filter(text.toLowerCase(), abstractions as any[], {
    pre: "<b>",
    post: "</b>",
    extract: function(el) {
      return el.text;
    }
  });
  const toShow = results.map(el => ({
    html: el.string,
    ...el.original
  }));
  return toShow;
}
