import fs = require("fs-extra");
import os = require("os");
import { loadPageJson, PageOfText } from "../io";

const fullpath =
  "F:\\GoogleSync\\megaCogLab\\ElectronTesting\\matt\\Active-learning-increases-student-performanc";

const test = async () => {
  const textPages = await loadPageJson(fullpath, "textToDisplay", []);

  let pageString = textPages[0].text[0].str;
  let offsets = [
    {
      id: textPages[0].text[0].id,
      charRangeInclusive: [0, textPages[0].text[0].str.length - 1]
    }
  ];
  for (let textItem of textPages[0].text.slice(1)) {
    const newString = textItem.str;
    const startIx = pageString.length;
    pageString += newString;
    offsets.push({
      id: textItem.id,
      charRangeInclusive: [startIx, pageString.length - 1]
    });
  }

  // test
  const id = "0001-0094";
  const sampleOrig = textPages[0].text.find(t => t.id === id);
  const sampleNew = offsets.find(t => t.id === id);
  const [startIx, endIx] = sampleNew.charRangeInclusive;
  console.log('|' + sampleOrig.str + '|');
  console.log('|' + pageString.slice(startIx, endIx + 1) + '|');
};
test();
