"use strict";

const {
    ipcRenderer: ipc,
    remote: {
        getCurrentWindow,
        BrowserWindow,
        dialog
    }
} = require("electron");

const util   = require("util");
const https  = require("https");
const bcrypt = require("bcrypt");

const { PAGE_LIMIT } = require("../js/constants.js");
const { toast , createTable, spinner } = require("../js/domutils.js");

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

    let hpwd;

    hpwd = await hashPassword(
        OBJECT_TO_CACHE.password,
        OBJECT_TO_CACHE.confirmPassword
    );

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
        await hospitalDb.receptionists.get( { email }),
        await hospitalDb.accountants.get({ email }),
        await hospitalDb.doctors.get({ email }),
        await hospitalDb.interns.get({ email }),
        await hospitalDb.laboratorists.get({ email }),
        await hospitalDb.pharmacists.get({ email }),
        await hospitalDb.nurses.get({ email }),
    ])
).filter( x => x !== undefined );

const createNewWindow = async ( { id , url , title , state , options } ) => {
    const winCreated =  BrowserWindow.getAllWindows().find( x => x.__bid === id );
    console.log(winCreated);
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

    win.__bid = title.replace(/\s+/,"");

    win.on("ready-to-show", () => {
        console.log(win);
        win.show();
    });

    win.on("close", () => {
        win = undefined;
    });

    ipc.once("get:window:state", (evt,id) => {
        ipc.sendTo(id,"window-state", state, options);
    });

    win.webContents.openDevTools( { mode: "bottom" } );
    win.webContents.loadURL(url);
};

module.exports.createNewWindow = createNewWindow;

const appendTable = function ( ops , deleteUser ) {

    const {
        __internal: { self , property },
        __newWindowSpec,
        result: apiResult,
        tableSpec,
        location,
        title,
        user,
        url
    } = ops;

    console.log(ops.__newWindowSpec, "duh");

    console.log(apiResult);

    if ( ! apiResult[user].length ) return;

    let table;

    if ( ( table = document.querySelector("table") )  )
        table.remove();

    table = createTable(
        {
            tableRows: apiResult[user],
            headers  : tableSpec.headers,
            id       : tableSpec.tableId
        }
    );


    document.querySelector(".currently-shown").appendChild(table);

    table.addEventListener("click", async evt => {

        const { target } = evt;

        if ( ! (target instanceof HTMLAnchorElement) ) {
            return;
        }

        const parentTr = target.parentNode.parentNode;
        const ops      = target.getAttribute("data-ops");
        const uId      = parentTr.getAttribute("user-id");
        console.log(parentTr);
        if ( ops === "delete" ) {
            const result = await deleteUser(uId);
            if ( result ) parentTr.remove();
            return;
        }

        await createNewWindow({
            options: { userId: uId , __newWindowSpec: Object.assign(__newWindowSpec,{ title }) },
            id: title.replace(/\s+/,""),
            state: "EDIT",
            title,
            url
        });

    });

    self.emit("navigated" , location ,  property );
};

module.exports.appendTable = appendTable;

module.exports.userOperation = function (op,loadUserCb) {

    const {
        __internal: { self, property },
        __newWindowSpec,
        text,
        url,
    } = op;

    const userOps    = document.createElement("div");
    const addNewUser = document.createElement("button");
    const prevIcon   = document.createElement("i");
    const nextIcon   = document.createElement("i");

    addNewUser.type = "button";
    addNewUser.textContent = text;

    prevIcon.classList.add("fa");
    prevIcon.classList.add("fa-arrow-alt-circle-left");
    prevIcon.classList.add("prev");
    prevIcon.classList.add("navigator-icon");

    nextIcon.classList.add("fa");
    nextIcon.classList.add("fa-arrow-alt-circle-right");
    nextIcon.classList.add("next");
    nextIcon.classList.add("navigator-icon");


    prevIcon.addEventListener("click", async () => {
        if ( property.__first__page > 0 )
            page({
                location: "prev",
                page: --property.__first__page,
                property,
                self
            },loadUserCb);
        nextIcon.classList.remove("no-more");
    });

    nextIcon.addEventListener("click", () => {
        if ( property.hasMore )
            page({
                location: "next",
                page: ++property.__first__page,
                property,
                self
            },loadUserCb);
    });

    userOps.setAttribute("class", "user-ops");

    userOps.appendChild(addNewUser);
    userOps.appendChild(prevIcon);
    userOps.appendChild(nextIcon);

    addNewUser.addEventListener("click" , async () => await createNewWindow( { id: text.replace(/\s+/,"") , url , title: text , options:{ __newWindowSpec }}));

    return userOps;
};

const page = async (ops,loadUser) => {

    if ( Math.sign(ops.page) === -1 ) return;

    ops.self.sectionNavOps.appendChild(ops.self.spin);

    const result = await loadUser(ops.page);

    ops.self.spin.remove();

    if ( ! result )
        return;

    ops.property.hasMore = result.hasMore;
    ops.self.emit("new-page-append", ops.location , result );
};


module.exports.loadImageToDom = ({file,fileReader}) => {

    const previewParent = document.querySelector(".image-preview");
    const previewImage  = document.querySelector(".previewer");
    const imageText     = document.querySelector(".image-preview-text");

    fileReader.readAsDataURL(file);

    fileReader.addEventListener("load", evt => {
        imageText.style.display = "none";
        previewParent.style.padding = "unset";
        previewImage.src = evt.target.result;
        previewImage.style.display = "block";
    });
};


module.exports.addUserFormHandler = async (FORM_STATE,{ evt , saveUser, editUser }) => {

    evt.preventDefault();

    if ( ! evt.target.checkValidity() ) {
        dialog.showErrorBox("Something does not feel right","Please correct the wrong fields");
        return;
    }

    const previewImage  = document.querySelector(".previewer");
    const btns = Array.from(document.querySelectorAll("button"));
    const fData = new FormData(evt.target);

    let result;

    btns.forEach( x => x.disabled = true );

    if ( FORM_STATE.state === "EDIT" ) {
        fData.append(FORM_STATE.__newWindowSpec.idType,FORM_STATE.userId);
        result = await editUser(fData,btns);
        if ( result ) ipc.sendTo( 1 , FORM_STATE.__newWindowSpec.ipcEventName);
        return ;
    }


    result = await saveUser(fData,btns);

    if ( ! result ) return;

    ipc.sendTo( 1 , FORM_STATE.__newWindowSpec.ipcEventName);

    window.location.reload();
};

module.exports.setupEventOnDomLoad = ( FORM_STATE , title ) => {

    const previewParent = document.querySelector(".image-preview");
    const previewImage  = document.querySelector(".previewer");
    const imageText     = document.querySelector(".image-preview-text");

    ipc.on("window-state", async (evt,state,opt) => {

        const {
            collection,
            idType,
            title
        } = FORM_STATE.__newWindowSpec = opt.__newWindowSpec;

        if ( state !== "EDIT" ) return;

        const userToEdit = await hospitalDb[collection].get( { [idType]: opt.userId } );

        document.querySelector("p.op").textContent = document.title = title;
        FORM_STATE.userId = opt.userId;
        FORM_STATE.state  = "EDIT";

        Object.keys(userToEdit).forEach( async x => {

            const el = document.querySelector(`[name=${x}]`);

            if ( ! el ) return;

            if ( x === "image" ) {
                const dataURI = (new TextDecoder()).decode(userToEdit["image"]);
                el.required = false;
                imageText.style.display = "none";
                previewParent.style.padding = "unset";
                previewImage.src = dataURI;
                previewImage.style.display = "block";
                return;
            }
            el.value = x === "password"
                ? ( () => {
                    document.querySelector("input[type=password]").required = false;
                    return "";
                })()
            : userToEdit[x];
        });

    });

    ipc.sendTo(1,"get:window:state", getCurrentWindow().webContents.id);
};
