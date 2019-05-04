"use strict";


const {
    ipcRenderer: ipc,
    remote: {
        BrowserWindow,
        getWindowById,
        dialog
    }
} = require("electron");

const {
    getDashboard,
    adminLoadUser,
    adminDeleteUser
} = require("../js/requests.js");

const { LOGIN_URL, ADD_NURSE_URL, ADD_RECEPTIONIST_URL = "f.html" } = require("../js/constants.js");
const { spinner , createTable } = require("../js/domutils.js");
const { appendTable , userOperation     } = require("../js/utils.js");
const { EventEmitter } = require("events");

const { navigation } = require("../js/eventHandlersReusables.js");

const admin = new(class Admin extends EventEmitter {

    constructor() {
        super();
        this.currentUser = {};
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

    __createSectionDiv({ elName, class: cl, property , result: apiResult }) {

        const el =  property[elName] = document.createElement("div");

        el.classList.add(cl);
        el.classList.add("currently-shown");

        property.__first__page = 0;
        property.hasMore       = apiResult.hasMore;

        this.sectionNavOps.appendChild(el);
        this.__setCredentials(apiResult);

        this.on("navigated", navigation );

        return el;
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

    async getUser(userObj) {

        const {
            props: { elName, class: cl, collection, nextUrl , idType , apiUrl },
            addNew: { text , url: userUrl },
            table: { tableSpec , title: editTitle, user: editWinUser , ipcEventName }
        } = userObj;

        this.__removeOnDom();
        this.sectionNavOps.appendChild(this.spin);

        const result = await adminLoadUser({ url: apiUrl, collection, nextUrl, PAGE: 0});

        this.spin.remove();

        if ( ! result )
            return;

        this.__createSectionDiv( { property : this.currentUser, elName, class: cl, result})
            .appendChild(userOperation(
                {
                    __newWindowSpec: { collection , idType, url: apiUrl, ipcEventName },
                    __internal     : { self: this , property: this.currentUser },
                    url            : userUrl,
                    text
                }, async (page) => await adminLoadUser(
                    { url: apiUrl, collection, nextUrl, PAGE: page }
                )
            ));


        this.on("new-page-append", (location,result) => {
            appendTable(
                {
                    tableSpec,
                    __internal  : { self: this, property: this.currentUser },
                    title       : editTitle,
                    user        : editWinUser,
                    url         : userUrl,
                    location,
                    result,
                    __newWindowSpec: { collection , idType, url: apiUrl, ipcEventName }
                },
                async (uId) => await adminDeleteUser(
                    { [idType]: uId },
                    { url: apiUrl, collection, idType }
                )
            );
        });

        this.emit("new-page-append", "prev" , result );
    }
});

admin.on("admin-receptionist", async () => {

    await admin.getUser({
        props: {
            elName: "receptionistDiv",
            class:  "receptionist-div",
            collection: "receptionists",
            nextUrl: LOGIN_URL,
            apiUrl : "receptionist",
            idType: "receptionistId"
        },
        addNew: {
            text: "Add Receptionist",
            url: ADD_RECEPTIONIST_URL
        },
        table: {
            tableSpec: { tableId: "receptionistId", headers: [ "image", "name", "email", "address" , "phone"] },
            title: "Edit Receptionist",
            user: "receptionists",
            ipcEventName: "admin-receptionist"
        }
    });
});
admin.on("admin-dashboard",    admin.dashboard );
admin.on("admin-nurse", async () => {
    await admin.getUser({
        props: {
            elName: "nurseDiv",
            class:  "nurse-div",
            collection: "nurses",
            nextUrl: LOGIN_URL,
            apiUrl : "nurse",
            idType: "nurseId"
        },
        addNew: {
            text: "Add Nurse",
            url: ADD_NURSE_URL
        },
        table: {
            tableSpec: { tableId: "nurseId", headers: [ "image", "name" , "rank", "email", "address" , "phone"] },
            title: "Edit Nurse",
            user: "nurses",
            ipcEventName: "admin-nurse"
        }
    });
});

ipc.on("admin-nurse", () => admin.emit("admin-nurse"));
ipc.on("admin-receptionist", () => admin.emit("admin-receptionist"));


module.exports = admin;
