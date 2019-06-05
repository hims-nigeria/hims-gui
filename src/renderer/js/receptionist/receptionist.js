"use strict";

const {
    ipcRenderer: ipc,
    remote: {
        BrowserWindow,
        getWindowById,
        dialog
    }
} = require("electron");


const { instance } = require("./receptionistRequest.js");
const { Admin    } = require("../admin/admin.js");

const {
    ADD_SERVICE_URL,
    LOGIN_URL
} = require("../constants.js");



const receptionist = module.exports = new( class Receptionist extends Admin {
    constructor(instance) {
        super(instance);
    }
})(instance);


receptionist.on("receptionist-dashboard", receptionist.dashboard );

receptionist.on("receptionist-service" , async () => {

    await receptionist.getUser({
        __notUser: { generateIdFrom: [ "serviceName", "department" ] },
        props: {
            elName: "serviceDiv",
            class:  "service-div",
            collection: "services",
            nextUrl: LOGIN_URL,
            apiUrl : "service",
            idType: "serviceId"
        },
        addNew: {
            text: "Add Service",
            url: ADD_SERVICE_URL
        },
        table: {
            tableSpec: { tableId: "serviceId", headers: [ "image" , "name" , "description" ] },
            title: "Edit Service",
            user: "services",
            ipcEventName: "receptionist-service"
        }
    });
});

ipc.on("receptionist-service", () => receptionist.emit("receptionist-service") );
