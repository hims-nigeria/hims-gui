"use strict";

const Dexie = require("dexie");
const hospitalDb = new Dexie("HospitalDB");

Dexie.debug = true;


hospitalDb.version(1).stores({
    healthFacility: "++id, &healthFacilityId, &email",
    accountants: "++id, healthFacility, &accountantId, &phoneNumber, &email",
    departments: "++id, healthFacility",
    doctors: "++id, healthFacility, &doctorId, &phoneNumber, &email",
    interns: "++id, healthFacility, &internId, &phoneNumber, &email",
    laboratorists: "++id, healthFacility, &laboratoristId, &phoneNumber, &email",
    nurses: "++id, healthFacility, &nurseId, &phoneNumber, &email",
    clients: "++id, healthFacility, &clientId, &phoneNumber, &email",
    pharmacists: "++id, healthFacility, &pharmacistId, &phoneNumber, &email",
    transactions: "++id, healthFacility",
    receptionists: "++id, healthFacility, &receptionistId, &phoneNumber, &email",
    interventions: "++id, healthFacility, &interventionId",
    subInterventions: "++id, healthFacility, &subInterventionId",

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
    interventionName: String,
    healthFacility  : String,
    interventionId  : String
});

hospitalDb.subInterventions.defineClass({
    subInterventionName: String,
    subInterventionId  : String,
    interventionName   : String, // from interventions collection
    healthFacility     : String
});

module.exports = hospitalDb;
