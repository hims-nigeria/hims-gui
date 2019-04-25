"use strict";

const { ipcRenderer: ipc, remote: { BrowserWindow, dialog } } = require("electron");

const util = require("util");
const https = require("https");
const bcrypt = require("bcrypt");
const { toast } = require("../js/domutils.js");

const hospitalDb = require("../js/db.js");

module.exports.checkForInternet = async cb => https.get("https://google.com", res => cb(res,null)).on("error", e => cb(null,e) );

const hashPassword = async (pwd, cpwd) => {
    if ( cpwd && (pwd !== cpwd) ) return false;
    try { return await bcrypt.hash( pwd , 10 ); } catch(ex) { return ex; }
};

module.exports.hashPassword = hashPassword;

module.exports.comparePassword = async ( plaintextPwd, hashedPwd )  => {
    try {
        return (await bcrypt.compare( plaintextPwd, hashedPwd ));
    } catch(ex) {
        return ex;
    }
};

module.exports.createExternalId = (...criteria) => {
    const crypto = require("crypto");
    return crypto.createHash("sha1").update(criteria.join("")).digest("hex");
};

module.exports.formDataToObject = async(formData,OBJECT_TO_CACHE) => {

    for ( let [ key , value ] of formData.entries() ) OBJECT_TO_CACHE[key] = value;

    const hpwd = await hashPassword(OBJECT_TO_CACHE.password,OBJECT_TO_CACHE.confirmPassword);

    if ( hpwd instanceof Error ) {
        toast({
            text: "An unexpected error has occurred. Please contact the system administrator",
            createAfter: 0
        });
        return false;
    }

    return hpwd;
};

module.exports.isEmailExists = async ( email ) => (
    await Promise.all([
        await hospitalDb.healthFacility.get({ email }),
        await hospitalDb.accountants.get({ email }),
        await hospitalDb.doctors.get({ email }),
        await hospitalDb.interns.get({ email }),
        await hospitalDb.laboratorists.get({ email }),
        await hospitalDb.pharmacists.get({ email }),
        await hospitalDb.nurses.get({ email }),
    ])
).filter( x => x !== undefined);

module.exports.createNewWindow = async ( { id , url , title , state , options }) => {

    const winCreated =  BrowserWindow.getAllWindows().find( x => x.__bid === id );

    if ( winCreated ) {
        dialog.showErrorBox("Cannot create multiple instance of window","This window is already opened");
        return;
    }

    let win = new BrowserWindow({
        maximizable  : false,
        minimizable  : true,
        resizable    : false,
        center       : true,
        show         : false,
        title        : title,
        height       : 603,
        width        : 463,
        __state      : state
    });

    win.__bid = "AddNurse";
    
    win.on("ready-to-show", () => {
        win.show();
    });

    win.on("close", () => {
        win = undefined;
    });

    ipc.once("get:window:state", (evt,id) => {
        ipc.sendTo(id,"window-state", state, state && options );
    });

    win.webContents.openDevTools( { mode: "bottom" } );
    win.webContents.loadURL(url);
};
