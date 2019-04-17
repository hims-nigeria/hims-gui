"use strict";

const Dexie = require("dexie");
const hospitalDb = new Dexie("HospitalDB");


hospitalDb.version(1).stores({
    healthFacility: "++id, &healthFacilityId, &email",
    /**
       sessionObject will contain an email address
       the email address will be used to map to the current logged in user
       put method will be used to replace whatever is in the session object
       during registration or logging in
     **/
    sessionObject: "id,&email",
    offlineAccounts: "++id,[id+newInformationType]"
});

module.exports = hospitalDb;
