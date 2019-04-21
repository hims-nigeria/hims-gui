"use strict";


const {
    ipcRenderer: ipc,
    remote: {
        BrowserWindow,
        getWindowById,
        dialog
    }
} = require("electron");

const { EventEmitter } = require("events");
const { getDashboard , adminLoadNurse , deleteNurse } = require("../js/requests.js");
const { LOGIN_URL, ADD_NURSE_URL } = require("../js/constants.js");

const { spinner , createTable } = require("../js/domutils.js");

const admin = new(class Admin extends EventEmitter {

    constructor() {
        super();
        this.nurse = {};
        this.sectionNavOps = document.querySelector(".section-nav-operation");
        this.spin = spinner();
    }

    __removeOnDom() {
        const el = document.querySelector(".currently-shown");
        if ( el ) el.remove();
    }

    __setCredentials(result) {

        const userRole = document.querySelector(".user-role");
        const userName = document.querySelector(".user-name");

        userRole.textContent = result.role;
        userName.textContent = result.fullName;
    }

    async dashboard() {

        this.__removeOnDom();
        this.sectionNavOps.appendChild(this.spin);

        const result = await getDashboard({
            nextUrl: LOGIN_URL
        });

        this.spin.remove();

        if ( ! result )
            return;

        let reportUl = document.createElement("ul");
        reportUl.classList.add("dashboard-list");
        reportUl.classList.add("currently-shown");

        let idx = 0;

        Object.keys(result.dashboardInfo).sort().forEach( x => {

            const li = document.createElement("li");
            const p  = document.createElement("p");
            const i  = document.createElement("i");

            const pText  = document.createElement("p");

            li.classList.add("dashboard-item");
            li.classList.add(`dashboard-item-${idx++}`);
            p.setAttribute("class", "dashboard-item-count");
            pText.setAttribute("class", "dashboard-item-name");

            p.textContent = result.dashboardInfo[x];
            pText.textContent = x.replace(/^./, x[0].toUpperCase());

            li.appendChild(pText);
            li.appendChild(p);
            li.appendChild(i);

            reportUl.appendChild(li);
        });

        this.__setCredentials(result);
        this.sectionNavOps.appendChild(reportUl);
    }
});

Object.defineProperties( admin.nurse , {
    getNurse: {

        async value(ev) {

            console.log(ev,"hi");

            this.__removeOnDom();
            this.sectionNavOps.appendChild(this.spin);

            const result = await adminLoadNurse({
                nextUrl: LOGIN_URL
            });

            this.spin.remove();

            console.log(result);

            if ( ! result )
                return;

            const nurseDiv = document.createElement("div");

            nurseDiv.classList.add("nurse-div");
            nurseDiv.classList.add("currently-shown");

            nurseDiv.appendChild(this.nurse.__nurseOps());

            this.__setCredentials(result);
            this.sectionNavOps.appendChild(nurseDiv);

            const table = createTable(
                {
                    headers: [ "image", "name" , "rank", "email", "address" , "phone"],
                    tableRows: result.nurses,
                    id: "nurseId"
                }
            );

            nurseDiv.appendChild(table);

            table.addEventListener("click", async evt => {

                const { target } = evt;

                if ( ! (target instanceof HTMLAnchorElement) ) {
                    return;
                }

                const parentTr = target.parentNode.parentNode;
                const ops      = target.getAttribute("data-ops");
                const uId      = parentTr.getAttribute("user-id");

                if ( ops === "delete" ) {
                    const result = await deleteNurse(
                        { nurseId: uId },
                        {}
                    );
                    if ( result ) parentTr.remove();
                    return;
                }

            });

        }
    },

    __nurseOps: {

        value() {

            const nurseOps = document.createElement("div");
            const addNurse = document.createElement("button");
            const prevIcon = document.createElement("i");
            const nextIcon = document.createElement("i");

            addNurse.type = "button";
            addNurse.textContent = "Add Nurse";

            prevIcon.classList.add("fa");
            prevIcon.classList.add("fa-arrow-alt-circle-left");

            nextIcon.classList.add("fa");
            nextIcon.classList.add("fa-arrow-alt-circle-right");

            nurseOps.setAttribute("class", "nurse-ops");

            nurseOps.appendChild(addNurse);
            nurseOps.appendChild(prevIcon);
            nurseOps.appendChild(nextIcon);

            addNurse.addEventListener("click" , () => {

                const winCreated =  BrowserWindow.getAllWindows().find( x => x.__bid === "AddNurse");

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
                    title        : "Add Nurse",
                    height       : 603,
                    width        : 463
                });

                win.__bid = "AddNurse";
                win.on("ready-to-show", () => {
                    win.show();
                });

                win.on("close", () => {
                    win = undefined;
                });

                win.webContents.openDevTools( { mode: "bottom" } );
                win.webContents.loadURL(ADD_NURSE_URL);
            });

            return nurseOps;
        }
    },

    createNurse: {
        value() {
        }
    }
});


admin.on("admin-dashboard", admin.dashboard );
admin.on("admin-nurse", admin.nurse.getNurse.bind(admin) );
admin.on("admin-nurse-create", admin.nurse.createNurse );

ipc.on("admin-nurse", admin.nurse.getNurse.bind(admin) );


module.exports = admin;
