"use strict";

const Dexie = require("dexie");
const hospitalDb = new Dexie("HospitalDB");

Dexie.debug = true;


hospitalDb.version(1).stores({
    healthFacility: "++id, &healthFacilityId, &email",
    accountants: "++id, healthFacility, &accontantId, &phoneNumber, &email",
    departments: "++id, healthFacility",
    doctors: "++id, healthFacility, &doctorId, &phoneNumber, &email",
    interns: "++id, healthFacility, &internId, &phoneNumber, &email",
    laboratorists: "++id, healthFacility, &laboratoristId, &phoneNumber, &email",
    nurses: "++id, healthFacility, &nurseId, &phoneNumber, &email",
    patients: "++id, healthFacility, &patientId, &phoneNumber, &email",
    pharmacists: "++id, healthFacility, &pharmacistId, &phoneNumber, &email",
    transactions: "++id, healthFacility",
    
    /**
       sessionObject will contain an email address
       the email address will be used to map to the current logged in user
       put method will be used to replace whatever is in the session object
       during registration or logging in
     **/
    sessionObject: "id,[healthFacilityId+role],&email",
    offlineAccounts: "++id,[id+newInformationType]"
});

module.exports = hospitalDb;
