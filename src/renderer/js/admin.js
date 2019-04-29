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
    deleteNurse
} = require("../js/requests.js");

const { LOGIN_URL, ADD_NURSE_URL, ADD_RECEPTIONIST_URL = "f.html" } = require("../js/constants.js");
const { spinner , createTable } = require("../js/domutils.js");
const { appendTable , userOperation     } = require("../js/utils.js");
const { EventEmitter } = require("events");

const { navigation } = require("../js/eventHandlersReusables.js");

const admin = new(class Admin extends EventEmitter {

    constructor() {
        super();
        this.nurse = {};
        this.receptionist = {};
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
});

Object.defineProperties( admin.nurse , {

    getNurse: {

        async value() {

            this.__removeOnDom();
            this.sectionNavOps.appendChild(this.spin);

            const result = await adminLoadUser({
                user: "nurses",
                nextUrl: LOGIN_URL,
                PAGE: 0
            });

            this.spin.remove();

            if ( ! result )
                return;

            this.__createSectionDiv( {
                property : this.nurse,
                elName   : "nurseDiv",
                class    : "nurse-div",
                result
            }).appendChild(userOperation({
                __internal: { self: this , property: this.nurse },
                text      : "Add Nurse",
                url       : ADD_NURSE_URL
            }, async (page) => {
                return await adminLoadUser({
                    url: "nurses",
                    nextUrl: LOGIN_URL,
                    PAGE: page
                });
            }));



            this.on("new-page-append", (location,result) => {
                appendTable(
                    {
                        tableSpec   : { tableId: "nurseId", headers: [ "image", "name" , "rank", "email", "address" , "phone"] },
                        __internal  : { self: this, property: this.nurse },
                        title       : "Edit Nurse",
                        user        : "nurses",
                        url         : ADD_NURSE_URL,
                        location,
                        result
                    },
                    async (uId) => {
                        return await deleteNurse(
                            { nurseId: uId },
                            {}
                        );
                    }
                );
            });

            this.emit("new-page-append", "prev" , result );
        }
    }
});

Object.defineProperties(admin.receptionist, {

    getReceptionist: {

        async value() {

            this.__removeOnDom();

            this.sectionNavOps.appendChild(this.spin);

            const result = await adminLoadUser({
                user: "receptionists",
                nextUrl: LOGIN_URL,
                PAGE   : 0
            });

            this.spin.remove();

            if ( ! result )
                return;

            this.__createSectionDiv( {
                property : this.receptionist,
                elName   : "receptionistsDiv",
                class    : "receptionist-div",
                result
            }).appendChild(
                userOperation({
                    __internal: { self: this , property: this.nurse },
                    property: this.receptionists,
                    text    : "Add Receptionist",
                    url     : ADD_RECEPTIONIST_URL
                }, async (page) => {
                    return await adminLoadUser({
                        user: "receptionists",
                        nextUrl: LOGIN_URL,
                        PAGE: page
                    });
                })
            );

            this.on("new-page-append", (location,result) => {
                appendTable(
                    {
                        tableSpec   : { tableId: "receptionistId", headers: [ "image", "name" , "email", "address" , "phone"] },
                        __internal  : { self: this, property: this.nurse },
                        title       : "Edit Receptionist",
                        user        : "receptionists",
                        url         : ADD_NURSE_URL,
                        location,
                        result
                    },
                    async (uId) => {
                        return await deleteReceptionist(
                            { receptionistId: uId },
                            {}
                        );
                    }
                );
            });

            this.emit("new-page-append", "prev" , result );
        }
    }
});

admin.on("admin-receptionist", admin.receptionist.getReceptionist.bind(admin));
admin.on("admin-dashboard",    admin.dashboard );
admin.on("admin-nurse",        admin.nurse.getNurse.bind(admin));

ipc.on("admin-nurse", admin.nurse.getNurse.bind(admin) );


module.exports = admin;
