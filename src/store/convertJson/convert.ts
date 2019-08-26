//@ts-nocheck
import path = require("path");
import jsonfile = require("jsonfile");
// import Plain from "slate-plain-serializer";
// import convertBase64 from "slate-base64-serializer";
import { PdfSegmentViewbox, UserDoc, PdfPublication } from "../creators";
import { listPdfs } from "../../renderer/io";
import { unique } from "../../renderer/utils";
// const fingerprintBuffer = body.slice(
//   0,
//   Math.min(FINGERPRINT_BYTES, body.length)
// );

// const FINGERPRINT_BYTES = 1024
// let hash = crypto.createHash("sha512");
// hash = hash.update(fingerprintBuffer);
// let hashStr = hash.digest("hex");
// let urlObj = new URL(url);
// let name = _.last(urlObj.pathname.split("/")).replace(/\.[^/.]+$/, "");
import * as fs from "fs-extra";
import * as path from "path";

import { PDFJSStatic } from "pdfjs-dist";
import * as _pdfjs from "pdfjs-dist";
const pdfjs: PDFJSStatic = _pdfjs as any;
const inDir =
  "C:\\Users\\mattj\\Desktop\\Problem Formulation in Data Science Competitions";
  const outDir = "C:\\Users\\mattj\\Desktop\\problemFormulation"
const convertStateJson = async () => {
  let deleteIds = [];
  let segmentedPdfIds = [];
  let state = await jsonfile.readFile(path.join(inDir, "state.json"));
  (Object.values(state.graph.nodes) as any[]).forEach(
    async (node: PdfSegmentViewbox | PdfPublication) => {
      if (node.data.type === "pdf.segment.viewbox") {
      }
    }
  );
  for (let node of Object.values(state.graph.nodes) as any[]) {
    if (node.data.type === "pdf.segment.viewbox") {
      segmentedPdfIds.push(node.data.pdfDir);

      const { id } = node as PdfSegmentViewbox;
      const data = state.graph.nodes[id].data;
      const maxStyle = state.graph.nodes[id].style.max;
      state.graph.nodes[id].data = {
        ...data,
        scale: 1,
        left: data.left / data.scale,
        top: data.top / data.scale,
        width: data.width / data.scale,
        height: data.height / data.scale,
        scalePreview: data.scale
      };
      state.graph.nodes[id].style.max = {
        ...state.graph.nodes[id].style.max,
        scrollToLeft: data.left / data.scale - 33,
        scrollToTop: data.top / data.scale - 33
      };
    }
  }
  segmentedPdfIds = unique(segmentedPdfIds).sort();
  console.log("segmentedPdfIds: ", segmentedPdfIds);

  for (let node of Object.values(state.graph.nodes) as any[]) {
    if (node.data.type === "pdf.publication") {
      if (!segmentedPdfIds.includes(node.id)) {
        delete state.graph.nodes[node.id];
        continue;
      }

      const pdfPathInfo = await listPdfs(
        path.join(inDir, node.id)
      );
      if (!pdfPathInfo.length) {
        deleteIds.push(node.data.pdfDir);
        continue;
      }

      const pdfPath = path.join(
        inDir,
        node.id,
        pdfPathInfo[0].fileNameWithExt
      );

      var data = new Uint8Array(fs.readFileSync(pdfPath));
      const pdf = await pdfjs.getDocument({ data });

      const { fingerprint, numPages } = pdf.pdfInfo;
      const originalId = node.id;
      node.data.originalFileName = node.data.pdfDir;
      node.data.pdfDir = fingerprint;
      node.id = fingerprint;
      node.style.id = fingerprint;
      node.data.numPages = numPages;

      for (let link of Object.values(state.graph.links)) {
        if (link.target === originalId) {
          state.graph.links[link.id].target = fingerprint;
        }
        if (link.source === originalId) {
          state.graph.links[link.id].source = fingerprint;
        }
      }

      for (let n of Object.values(state.graph.nodes)) {
        if (n.data.pdfDir === originalId) {
          state.graph.nodes[n.id].data.originalFileName =
            state.graph.nodes[n.id].data.pdfDir;
          state.graph.nodes[n.id].data.pdfDir = fingerprint;
        }
      }

      const dirNameExists = await fs.pathExists(
        path.join(outDir, fingerprint)
      );

      if (!dirNameExists) {
        await fs.copy(
          path.join(inDir, originalId),
          path.join(outDir, fingerprint)
        );

        await fs.move(
          path.join(
            outDir,
            fingerprint,
            pdfPathInfo[0].fileNameWithExt
          ),
          path.join(
            outDir,
            fingerprint,
            fingerprint + ".pdf"
          )
        );
        await jsonfile.writeFile(
          path.join(
            outDir,
            fingerprint,
            "pdfInfo.json"
          ),
          {
            ...pdf.pdfInfo,
            originalFileName: pdfPathInfo[0].fileNameWithExt
          }
        );

        await jsonfile.writeFile(
          path.join(
            outDir,
            fingerprint,
            pdfPathInfo[0].fileNameWithExt + ".name"
          ),
          { useThisToSearchByFileName: true }
        );
      } else {
      }

      // try {
      //   const pdfPathInfo = await listPdfs(
      //     path.join("C:\\Users\\mattj\\Desktop\\joel", originalId)
      //   )
      // } catch {}

      // rename folder / rename file
    }
  }
  await jsonfile.writeFile(
    path.join(outDir, "state.json"),
    state
  );
};
convertStateJson();
// "id": "334059b0-66e5-11e9-b020-43702fcef17c",
// "data": {
//   "type": "userDoc",
//   "base64": "JTdCJTIyb2JqZWN0JTIyJTNBJTIydmFsdWUlMjIlMkMlMjJkb2N1bWVudCUyMiUzQSU3QiUyMm9iamVjdCUyMiUzQSUyMmRvY3VtZW50JTIyJTJDJTIyZGF0YSUyMiUzQSU3QiU3RCUyQyUyMm5vZGVzJTIyJTNBJTVCJTdCJTIyb2JqZWN0JTIyJTNBJTIyYmxvY2slMjIlMkMlMjJ0eXBlJTIyJTNBJTIycGFyYWdyYXBoJTIyJTJDJTIyZGF0YSUyMiUzQSU3QiU3RCUyQyUyMm5vZGVzJTIyJTNBJTVCJTdCJTIyb2JqZWN0JTIyJTNBJTIydGV4dCUyMiUyQyUyMmxlYXZlcyUyMiUzQSU1QiU3QiUyMm9iamVjdCUyMiUzQSUyMmxlYWYlMjIlMkMlMjJ0ZXh0JTIyJTNBJTIyYXNkZiUyMiUyQyUyMm1hcmtzJTIyJTNBJTVCJTVEJTdEJTVEJTdEJTVEJTdEJTVEJTdEJTdE",
//   "text": "asdf",
//   "useTextForAutocomplete": true
// },
// "meta": {
//   "createdBy": "defaultUser",
//   "timeCreated": 1556147012326,
//   "timeUpdated": 1556147026096
// },
// "style": {
//   "min": {
//     "left": 30,
//     "top": 50,
//     "width": 220,
//     "height": 120
//   },
//   "max": {
//     "left": 121,
//     "top": 26,
//     "width": 220,
//     "height": 120
//   },
//   "modes": [
//     "max",
//     "min"
//   ],
//   "modeIx": 0,
//   "lockedCorner": "nw",
//   "fontSize": 26
// }
// "c76fd820-6129-11e9-a71a-0d16ecaabc88": {
//     "id": "c76fd820-6129-11e9-a71a-0d16ecaabc88",
//     "data": {
//       "type": "userHtml",
//       "html": "<p>lots of problems with biomed scholarly communication and scientific work</p>",
//       "text": "lots of problems with biomed scholarly communication and scientific work"
//     },
//     "meta": {
//       "createdBy": "defaultUser",
//       "timeCreated": 1555277191234,
//       "timeUpdated": 1555516786517
//     },
//     "style": {
//       "left": 2615.0380935149865,
//       "top": 2538.2004383356802,
//       "width": 300,
//       "height": 110
//     }
//   }

//     "style": {
//       "id": "00af34e0-6149-11e9-a71a-0d16ecaabc88",
//       "type": "circle",
//       "left": 149.70194919935105,
//       "top": 1883.0035507527982,
//       "width": 605.8286,
//       "height": 180.22800000000007,
//       "fill": "blue",
//       "draggabled": true,
//       "radius": 5,
//       "stroke": "blue",
//       "strokeWidth": 4
//     }
//   }

//     "style": {
//       "min": {
//         "id": "32adb6a0-66e5-11e9-b020-43702fcef17c",
//         "left": 30,
//         "top": 170,
//         "width": 220,
//         "height": 60
//       },
//       "max": {
//         "id": "32adb6a0-66e5-11e9-b020-43702fcef17c",
//         "left": 30,
//         "top": 170,
//         "width": 583.866744832,
//         "height": 191.65519999999992
//       },
//       "modes": [
//         "min",
//         "max"
//       ],
//       "modeIx": 0,
//       "lockedCorner": "nw"
//     }

//   await jsonfile.writeFile(textToDisplayFile, {
//     pageNumber,
//     text: textToDisplay,
//     // maybe use this to detect rotation?
//     viewportFlat: { width, height, xMin, yMin, xMax, yMax }
//   });
