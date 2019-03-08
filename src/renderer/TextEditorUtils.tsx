import { getRegexIndexes } from "./utils";
import { oc } from "ts-optchain";

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

  return {
    isEndOfWord,
    isAfterSpace,
    text: text.slice(leftSpaceIx, rightSpaceIx).trim()
  };
}

export const onSlash = (event, editor, next) => {
  const { value } = editor;
  const { selection } = value;
  if (selection.isExpanded) return next();
  const { startBlock } = value;
  const { start } = selection;
  const charBeforeSlash = startBlock.text[start.offset-1] || ' '
  if ([' ', '/'].includes(charBeforeSlash)) {
      return true
  } else {
      return false
  }
  return next()
  
};
