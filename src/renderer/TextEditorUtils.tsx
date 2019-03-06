import { getRegexIndexes } from "./utils";
import { oc } from "ts-optchain";

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
  console.log(text, cursorLocInText);

  const isAfterSpace = (text[cursorLocInText - 1] || " ") === " ";
  const isEndOfWord = (text[cursorLocInText] || " ") === " " && !isAfterSpace;

  return {
    isEndOfWord,
    isAfterSpace,
    text: text.slice(leftSpaceIx, rightSpaceIx).trim()
  };
}
