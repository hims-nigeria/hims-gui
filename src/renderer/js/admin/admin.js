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
    LOGIN_URL,
    ADD_NURSE_URL,
    ADD_CLIENT_URL,
    ADD_DOCTOR_URL,
    ADD_INTERN_URL,
    ADD_DEPARTMENT_URL,
    ADD_ACCOUNTANT_URL,
    ADD_PHARMACIST_URL,
    ADD_RECEPTIONIST_URL,
    ADD_INTERVENTION_URL,
    ADD_LABORATORIST_URL,
    ADD_SUBINTERVENTION_URL
} = require("../../js/constants.js");

const hospitalDb = require("../../js/db.js");

const { spinner , createTable , buildAdminAccountPage } = require("../../js/domutils.js");
const { appendTable , userOperation     } = require("../../js/utils.js");
const { EventEmitter } = require("events");

const { navigation } = require("../../js/eventHandlersReusables.js");

const { instance } = require("../../js/admin/adminRequest.js");

const admin = new(class Admin extends EventEmitter {

    constructor() {
        super();
        this.currentSection = {};
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

        const result = await instance.getDashboard({
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
            __notUser,
            props: { elName, class: cl, collection, nextUrl , idType , apiUrl , role },
            addNew: { text , url: userUrl },
            table: { tableSpec , title: editTitle, user: editWinUser , ipcEventName }
        } = userObj;

        this.__removeOnDom();
        this.sectionNavOps.appendChild(this.spin);

        const result = await instance.adminLoadUser({ url: apiUrl, collection, nextUrl, PAGE: 0});

        this.spin.remove();

        if ( ! result )
            return;

        this.__createSectionDiv( { property : this.currentSection, elName, class: cl, result})
            .appendChild(userOperation(
                {
                    __newWindowSpec: { collection , idType, url: apiUrl, ipcEventName , role , generateIdFrom: __notUser ? __notUser.generateIdFrom : [] },
                    __internal     : { self: this , property: this.currentSection },
                    url            : userUrl,
                    text
                }, async (page) => await instance.adminLoadUser(
                    { url: apiUrl, collection, nextUrl, PAGE: page }
                )
            ));


        this.on("new-page-append", (location,result) => {
            appendTable(
                {
                    tableSpec,
                    __internal  : { self: this, property: this.currentSection },
                    title       : editTitle,
                    user        : editWinUser,
                    url         : userUrl,
                    location,
                    result,
                    __newWindowSpec: { collection , idType, url: apiUrl, ipcEventName , role , generateIdFrom: __notUser ? __notUser.generateIdFrom : [] }
                },
                async (uId) => __notUser
                    ? await instance.adminDeleteUser({ [idType]: uId },{ url: apiUrl, collection, idType })
                    : await instance.adminDeleteUser({ [idType]: uId },{ url: apiUrl, collection, idType } , async healthFacilityId => {
                        await hospitalDb.healthFacility.where({ healthFacilityId }).modify( result => {
                            result.dashboardInfo[collection] -= 1;
                        });
                    })
            );
        });

        this.emit("new-page-append", "prev" , result );
    }

    async adminAccount() {

        this.__removeOnDom();

        this.sectionNavOps.appendChild(this.spin);

        this.__setCredentials(await buildAdminAccountPage(this.sectionNavOps));

        this.spin.remove();
    }
});

admin.on("admin-dashboard",    admin.dashboard );

admin.on("admin-receptionist", async () => {

    await admin.getUser({
        props: {
            elName: "receptionistDiv",
            class:  "receptionist-div",
            collection: "receptionists",
            nextUrl: LOGIN_URL,
            apiUrl : "receptionist",
            idType: "receptionistId",
            role: "receptionist"
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

admin.on("admin-nurse", async () => {
    await admin.getUser({
        props: {
            elName: "nurseDiv",
            class:  "nurse-div",
            collection: "nurses",
            nextUrl: LOGIN_URL,
            apiUrl : "nurse",
            idType: "nurseId",
            role: "nurse"
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

admin.on("admin-intern", async () => {
    await admin.getUser({
        props: {
            elName: "internDiv",
            class:  "intern-div",
            collection: "interns",
            nextUrl: LOGIN_URL,
            apiUrl : "intern",
            idType: "internId",
            role: "intern"
        },
        addNew: {
            text: "Add Intern",
            url: ADD_INTERN_URL
        },
        table: {
            tableSpec: { tableId: "internId", headers: [ "name", "duty", "email", "address" , "phone"] },
            title: "Edit Intern",
            user: "interns",
            ipcEventName: "admin-intern"
        }
    });
});


admin.on("admin-doctor", async () => {
    await admin.getUser({
        props: {
            elName: "doctorDiv",
            class:  "doctor-div",
            collection: "doctors",
            nextUrl: LOGIN_URL,
            apiUrl : "doctor",
            idType: "doctorId",
            role: "doctor"
        },
        addNew: {
            text: "Add Doctor",
            url: ADD_DOCTOR_URL
        },
        table: {
            tableSpec: { tableId: "doctorId", headers: [ "image", "name", "email" , "phone" , "department" ] },
            title: "Edit Doctor",
            user: "doctors",
            ipcEventName: "admin-doctor"
        }
    });
});


admin.on("admin-client", async () => {
    await admin.getUser({
        props: {
            elName: "clientDiv",
            class:  "client-div",
            collection: "clients",
            nextUrl: LOGIN_URL,
            apiUrl : "client",
            idType: "clientId",
            role: "client"
        },
        addNew: {
            text: "Add Client",
            url: ADD_CLIENT_URL
        },
        table: {
            tableSpec: { tableId: "clientId", headers: [ "card no", "image", "email" , "phone", "sex" , "birth date", "age" , "blood group"  ] },
            title: "Edit Client",
            user: "clients",
            ipcEventName: "admin-client"
        }
    });
});


admin.on("admin-pharmacist", async () => {
    await admin.getUser({
        props: {
            elName: "pharmacistDiv",
            class:  "pharmacist-div",
            collection: "pharmacists",
            nextUrl: LOGIN_URL,
            apiUrl : "pharmacist",
            idType: "pharmacistId",
            role: "pharmacist"
        },
        addNew: {
            text: "Add Pharmacist",
            url: ADD_PHARMACIST_URL
        },
        table: {
            tableSpec: { tableId: "pharmacistId", headers: [ "image", "name", "email" , "address" , "phone"] },
            title: "Edit Pharmacist",
            user: "pharmacists",
            ipcEventName: "admin-pharmacist"
        }
    });
});


admin.on("admin-laboratorist", async () => {
    await admin.getUser({
        props: {
            elName: "laboratoristDiv",
            class:  "laboratorist-div",
            collection: "laboratorists",
            nextUrl: LOGIN_URL,
            apiUrl : "laboratorist",
            idType: "laboratoristId",
            role: "laboratorist"
        },
        addNew: {
            text: "Add Laboratorist",
            url: ADD_LABORATORIST_URL
        },
        table: {
            tableSpec: { tableId: "laboratoristId", headers: [ "image", "name", "email" , "address" , "phone"] },
            title: "Edit Laboratorist",
            user: "laboratorists",
            ipcEventName: "admin-laboratorist"
        }
    });
});



admin.on("admin-accountant", async () => {
    await admin.getUser({
        props: {
            elName: "accountantDiv",
            class:  "accountant-div",
            collection: "accountants",
            nextUrl: LOGIN_URL,
            apiUrl : "accountant",
            idType: "accountantId",
            role: "accountant"
        },
        addNew: {
            text: "Add Accountant",
            url: ADD_ACCOUNTANT_URL
        },
        table: {
            tableSpec: { tableId: "accountantId", headers: [ "image", "name", "email" , "address" , "phone"] },
            title: "Edit Accountant",
            user: "accountants",
            ipcEventName: "admin-accountant"
        }
    });
});

admin.on("admin-interventions", async () => {
    await admin.getUser({
        __notUser: { generateIdFrom: [ "interventionName" ] },
        props: {
            elName: "interventionDiv",
            class:  "intervention-div",
            collection: "interventions",
            nextUrl: LOGIN_URL,
            apiUrl : "intervention",
            idType: "interventionId"
        },
        addNew: {
            text: "Add Intervention",
            url: ADD_INTERVENTION_URL
        },
        table: {
            tableSpec: { tableId: "interventionId", headers: [ "intervention" ] },
            title: "Edit Intervention",
            user: "interventions",
            ipcEventName: "admin-interventions"
        }
    });
});

admin.on("admin-subinterventions" , async () => {
    await admin.getUser({
        __notUser: { generateIdFrom: [ "interventionName" , "subInterventionName" ] },
        props: {
            elName: "subInterventionDiv",
            class:  "subIntervention-div",
            collection: "subInterventions",
            nextUrl: LOGIN_URL,
            apiUrl : "subintervention",
            idType: "subInterventionId"
        },
        addNew: {
            text: "Add Subintervention",
            url: ADD_SUBINTERVENTION_URL
        },
        table: {
            tableSpec: { tableId: "subInterventionId", headers: [ "sub intervention" , "category" ] },
            title: "Edit Subintervention",
            user: "subInterventions",
            ipcEventName: "admin-subinterventions"
        }
    });
});


admin.on("admin-department", async () => {
    await admin.getUser({
        __notUser: { generateIdFrom: [ "name", "description" ] },
        props: {
            elName: "departmentDiv",
            class:  "department-div",
            collection: "departments",
            nextUrl: LOGIN_URL,
            apiUrl : "department",
            idType: "departmentId"
        },
        addNew: {
            text: "Add Department",
            url: ADD_DEPARTMENT_URL
        },
        table: {
            tableSpec: { tableId: "departmentId", headers: [ "image" , "name" , "description" ] },
            title: "Edit Department",
            user: "departments",
            ipcEventName: "admin-department"
        }
    });
});


admin.on("admin-account", async () => {
    await admin.adminAccount();
});

ipc.on("admin-nurse",            () => admin.emit("admin-nurse"));
ipc.on("admin-intern",           () => admin.emit("admin-intern"));
ipc.on("admin-doctor",           () => admin.emit("admin-doctor"));
ipc.on("admin-client",           () => admin.emit("admin-client"));
ipc.on("admin-department",       () => admin.emit("admin-department"));
ipc.on("admin-pharmacist",       () => admin.emit("admin-pharmacist"));
ipc.on("admin-accountant",       () => admin.emit("admin-accountant"));
ipc.on("admin-receptionist",     () => admin.emit("admin-receptionist"));
ipc.on("admin-laboratorist",     () => admin.emit("admin-laboratorist"));
ipc.on("admin-interventions",    () => admin.emit("admin-interventions"));
ipc.on("admin-subinterventions", () => admin.emit("admin-subinterventions"));

module.exports = admin;
