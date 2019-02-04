import fs = require("fs-extra");
import os = require("os");
import path = require("path");
import glob = require("glob");
import uuidv1 = require("uuid/v1");
const { homedir, username } = os.userInfo();
const pdfDir = path.join(homedir, "pdfs");

interface FileInfo {
  pdfPath: string;
  pdfName: string;
  dataDir: string;
}

export const listPdfs = (fullPath: string): Promise<FileInfo[]> =>
  new Promise(resolve => {
    glob(fullPath + "/*.pdf", { nodir: true }, (err, files) => {
      const fileInfo = files.map(f => {
        return {
          pdfPath: f,
          pdfName: path.basename(f),
          dataDir: f.replace(".pdf", "")
        };
      });
      resolve(fileInfo);
    });
  });

// export const mkdirForPdfs = ()

export const test = async () => {
  const { homedir, username } = os.userInfo();
  const pdfDir = path.join(homedir, "pdfs");
  const infos = await listPdfs(pdfDir);

  for (let info of infos) {
    const dirExists = fs.pathExists(info.dataDir);
    const postFix = dirExists ? "_" + uuidv1() : "";
    const dataDir = dirExists ? info.dataDir + postFix : info.dataDir;
    await fs.ensureDir(dataDir);
    await fs.move(
      info.pdfPath,
      path.join(dataDir, info.pdfName.replace(".pdf", postFix + ".pdf"))
    );
  }

  glob(pdfDir + "/*/", {}, (err, files) => {
    console.log(files);
  });
};
test();
