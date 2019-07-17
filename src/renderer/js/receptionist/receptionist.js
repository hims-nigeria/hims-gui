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

const { AdminRequest } = require("../admin/adminRequest.js");

const {
    ADD_DAILY_ATTENDANCE_URL,
    ADD_HOSPITAL_URL,
    ADD_SERVICE_URL,
    LOGIN_URL
} = require("../constants.js");

const {
    handleUploadedImage,
    buildReceptionistAccountPage
} = require("../../js/domutils.js");

const receptionist = module.exports = new( class Receptionist extends Admin {
    constructor(instance) {
        super(instance);
    }

    async receptionistAccount() {
        await super.adminAccount(buildReceptionistAccountPage);
        AdminRequest.UserProfileImageLoad();
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
            tableSpec: { tableId: "serviceId", headers: [ "name" , "rate" , "department" ] },
            title: "Edit Service",
            user: "services",
            ipcEventName: "receptionist-service"
        }
    });
});

receptionist.on("receptionist-manage-hospital" , async () => {

    await receptionist.getUser({
        __notUser: { generateIdFrom: [ "donorHospitalName" ] },
        props: {
            elName: "hospitalDiv",
            class:  "hospital-div",
            collection: "donorHospital",
            nextUrl: LOGIN_URL,
            apiUrl : "donor-hospital",
            idType: "donorHospitalId"
        },
        addNew: {
            text: "Add Hospital",
            url: ADD_HOSPITAL_URL
        },
        table: {
            tableSpec: { tableId: "donorHospitalId", headers: [ "Hospital Name" ] },
            title: "Edit Hospital",
            user: "donorHospital",
            ipcEventName: "receptionist-manage-hospital"
        }
    });
});

receptionist.on("receptionist-daily-attendance" , async () => {
    
    await receptionist.getUser({
        __notUser: { generateIdFrom: [ "cardNo" , "fullName" ] },
        props: {
            elName: "dailyAttendanceDiv",
            class:  "daily-attendance-div",
            collection: "dailyAttendance",
            nextUrl: LOGIN_URL,
            apiUrl : "daily-attendance",
            idType: "dailyAttendanceId"
        },
        addNew: {
            text: "Add Daily Attendance",
            url: ADD_DAILY_ATTENDANCE_URL
        },
        table: {
            tableSpec: { tableId: "dailyAttendanceId", headers: [ "Registration Date" , "Patient/Client Name", "Card No" , "Birth Date", "Gender" ] },
            title: "Edit Daily Attendance",
            user: "dailyAttendance",
            ipcEventName: "receptionist-daily-attendance"
        }
    }); 
});

receptionist.on("receptionist-profile", async () => {
    await receptionist.receptionistAccount();
});

ipc.on("receptionist-service", () => receptionist.emit("receptionist-service") );
ipc.on("receptionist-manage-hospital", () => receptionist.emit("receptionist-manage-hospital"));
ipc.on("receptionist-daily-attendance", () => receptionist.emit("receptionist-daily-attendance"));
