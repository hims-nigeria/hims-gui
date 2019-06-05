"use strict";

const Dexie = require("dexie");
const hospitalDb = new Dexie("HospitalDB");

Dexie.debug = true;


hospitalDb.version(1).stores({
    healthFacility: "++id, &healthFacilityId, &email",
    accountants: "++id, healthFacilityId, &accountantId, &phoneNumber, &email",
    departments: "++id, healthFacilityId, &departmentId",
    doctors: "++id, healthFacilityId, &doctorId, &phoneNumber, &email",
    interns: "++id, healthFacilityId, &internId, &phoneNumber, &email",
    laboratorists: "++id, healthFacilityId, &laboratoristId, &phoneNumber, &email",
    nurses: "++id, healthFacilityId, &nurseId, &phoneNumber, &email",
    clients: "++id, healthFacilityId, &clientId, &phoneNumber, &email",
    pharmacists: "++id, healthFacilityId, &pharmacistId, &phoneNumber, &email",
    transactions: "++id, healthFacilityId",
    receptionists: "++id, healthFacilityId, &receptionistId, &phoneNumber, &email",
    interventions: "++id, healthFacilityId, &interventionId",
    subInterventions: "++id, healthFacilityId, &subInterventionId",



    services: "++id, healthFacilityId, &serviceId",

    /**
       sessionObject will contain an email address
       the email address will be used to map to the current logged in user
       put method will be used to replace whatever is in the session object
       during registration or logging in
     **/
    sessionObject: "id,[healthFacilityId+role],&email",
    offlineAccounts: "++,newInformationType"
});


hospitalDb.interventions.defineClass({
    interventionName  : String,
    healthFacilityId  : String,
    interventionId    : String
});

hospitalDb.subInterventions.defineClass({
    subInterventionName: String,
    subInterventionId  : String,
    interventionName   : String, // from interventions collection
    healthFacilityId   : String
});

hospitalDb.services.defineClass({
    serviceName     : String,
    serviceId       : String,
    department      : String,
    rate            : Number,
    healthFacilityId: String
});

module.exports = hospitalDb;
