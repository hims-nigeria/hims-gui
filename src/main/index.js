"use strict";

const electron = require("electron");
const { BrowserWindow , app } = electron;

if ( process.env.NODE_ENV === "development" )
    require("electron-reload")(app.getAppPath() , {
        electron: `${app.getAppPath()}/node_modules/.bin/electron`,
        ignored: /node_modules|[\/\\]\./,
        hasResetMethod: "exit"
    });

function createWindow() {

    require("./menu.js");
    
    app.setName("Himi Nigeria");
    app.setVersion("1.0");

    const win = new BrowserWindow({
        show: false,
        title: "HIMI Hospital Management System",
        ...electron.screen.getPrimaryDisplay().size,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.on("ready-to-show", () => {
        win.show();
    });

    win.on("close", () => {
        win = null;
    });

    win.loadURL(`file://${app.getAppPath()}/src/renderer/html/loader.html`);

    win.webContents.openDevTools({ mode: "detach" });
}

app.on("ready", createWindow );
app.on("will-quit", () => { app.quit(); });
