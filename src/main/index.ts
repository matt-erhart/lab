import { app, BrowserWindow, BrowserView, Menu, MenuItem } from "electron";
import * as path from "path";
import { format as formatUrl } from "url";
import { existsElseMake, listDirs, ls } from "../renderer/io";
import fs = require("fs-extra");
import console = require("console");

const isDevelopment = process.env.NODE_ENV !== "production";

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;

function createMainWindow() {
  const window = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    }
  });

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
    // window.loadURL(`file://${__dirname}/../renderer/Wobbrock-2015.pdf`)
  } else {
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, "index.html"),
        protocol: "file",
        slashes: true
      })
    );
  }

  window.on("closed", () => {
    mainWindow = null;
  });

  window.webContents.on("devtools-opened", () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Set Pdf Folder",
          async click() {
            await setPdfRootDir();
            window.reload();
          }
        },
        {
          label: "Reload - mac users",
          async click() {
            window.reload();
          }
        },
        {
          label: "Clean up cache",
          async click() {
            await cleanUpAutograb();
            console.log("Cleaning up and reloading")
            window.reload();
          }
        },
        {
          label: "Open devTool",
          async click() {
            mainWindow.openDevTools();
          }
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "pasteandmatchstyle" },
        { role: "delete" },
        { role: "selectall" }
      ]
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forcereload" },
        { role: "toggledevtools" },
        { type: "separator" },
        { role: "resetzoom" },
        { role: "zoomin" },
        { role: "zoomout" },
        { type: "separator" },
        { role: "togglefullscreen" }
      ]
    },
    {
      role: "window",
      submenu: [{ role: "minimize" }, { role: "close" }]
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click() {
            require("electron").shell.openExternal("https://electronjs.org");
          }
        }
      ]
    }
  ];

  if (process.platform === "darwin") {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideothers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" }
      ]
    });

    // Edit menu
    template[1].submenu.push(
      //@ts-ignore
      { type: "separator" },
      {
        label: "Speech",
        submenu: [{ role: "startspeaking" }, { role: "stopspeaking" }]
      }
    );

    // Window menu
    template[3].submenu = [
      { role: "close" },
      { role: "minimize" },
      { role: "zoom" },
      { type: "separator" },
      { role: "front" }
    ];
  }
  //@ts-ignore
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return window;
}

// quit application when all windows are closed
app.on("window-all-closed", () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
});
const { dialog } = require("electron");
const settings = require("electron-settings");

// create main BrowserWindow when electron is ready
app.on("ready", async () => {
  const pdfRootDir = settings.get("pdfRootDir") || false;
  if (!pdfRootDir) {
    await setPdfRootDir();
  }
  mainWindow = createMainWindow();
});

const setPdfRootDir = async () => {
  const pathArray = dialog.showOpenDialog({ properties: ["openDirectory"] });
  const pdfRootDir = path.join(...pathArray);
  settings.set("pdfRootDir", path.join(...pathArray));
  const stateJsonPath = path.join(pdfRootDir, "./state.json");
  const madeEmptyJson = await existsElseMake(stateJsonPath, {});
};

const cleanUpAutograb = async () => {

  const pdfDirs = await listDirs(settings.get("pdfRootDir"));
  for (let dir of pdfDirs) {

    const files = await ls(dir + "/*");
    for (let file of files) {
      if (file.includes("metadataToHighlight") || file.includes("metadataFromGROBID")) {
        await fs.removeSync(file)
      }
    }
  }
  // TODO clean up autograb node in state.json
}