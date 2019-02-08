type id = string | number;

interface pubBox {
  // aka rectange
  id: id;
  top: number;
  left: number;
  width: number;
  height: number;
  imgPath: string;
  text: string;
  userId: string;
  pubId: string;
  pageNumber: number;
}

interface textNode {
  nodes: textNode[];
}

interface stringSegment {
  start: number;
  end: number;
  pubTextId: id; // create new pubText on 'a'
}

interface pubText {
  // aka Range / selection / hightlight
  id: id;
  range: Range; // of html nodes over pdf page
  text: string;
  userId: string;
  pubId: string;
  stringSegments: stringSegment[]
}

interface userText {
  // only this will cross paper, but it'll link back
  id: id;
  text: string;
  userId: string;
}

interface edge {
  id: id;
  source: id;
  sourceType: string;
  target: id;
  targetType: string;
  type: "more" | "same"; // UI can have 'less' but well just flip it to more
}

// todo collect all the shorter things, use box as lense
// todo nested collections of shorts in section heirarchy
// todo highlight pdfs

// phrase -> synonym = same
// acronymn/truncated -> phrase = more
// phrase -> sentences+ = more
// phrase -> example = more
// summary -> box = either
// pub box -> comment = more
// pub box -> pub box = either
// super cat -> cat -> sub cat = more
// methods section -> peronal review = more

// pub text0: 1[Wave menus]: Improving the 2[novice mode] of 3[marking menus].
// pub text1 Wave menues
// pub text2 novice mode
// pub text3 marking menus

// pub text4 def. of wave...
// pub text5 def. of novice...

// edge text0
