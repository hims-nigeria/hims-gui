"use strict";

const path = require("path");
const electron = require("electron");

const {
    BrowserWindow,
    nativeImage,
    protocol,
    session,
    Menu,
    app
} = electron;

//protocol.registerStandardSchemes( [ "file" ] , { secure: true });

if ( process.env.NODE_ENV === "development" )
    require("electron-reload")(app.getAppPath() , {
        electron: `${app.getAppPath()}/node_modules/.bin/electron`,
        ignored: /node_modules|[\/\\]\./,
        hasResetMethod: "exit"
    });

function createWindow() {

    //require("./menu.js");


    const ses = session.fromPartition("persist:sessionId");

    let win = new BrowserWindow({
        show: false,
        title: "HIMI Hospital Management System",
        ...electron.screen.getPrimaryDisplay().size,
        icon: nativeImage.createFromPath("../renderer/assets/logo-1.png"),
        webPreferences: {
            nodeIntegration: true
        }
    });

    ses.cookies.get( { }, ( err , cdata ) => {
        if ( err ) return console.error(err);
        const [ d ] = cdata;
        return console.log(d,"hi");
    });

    ses.cookies.set({
        url: "http://localhost:3001",
        name: "sessionId",
        domain: "localhost",
        expirationDate: Math.floor(Date.now()/1000) * 1209600
    } , error => console.log(error) );


    Menu.setApplicationMenu(null);

    app.setName("Himi Nigeria");
    app.setVersion("1.0");

    win.on("ready-to-show", () => {
        win.show();
    });

    win.on("close", () => {
        win = null;
    });

    win.loadURL(`file://${app.getAppPath()}/src/renderer/html/loader.html`);

    win.webContents.openDevTools({ mode: "bottom" });
}

app.on("ready", createWindow );
app.on("will-quit", () => { app.quit(); });
