"use strict";

const { AdminRequest } = require("../admin/adminRequest.js");
const { RECEPTIONIST_URL } = require("../constants.js");

class ReceptionRequest extends AdminRequest {
    constructor(obj) {
        super(obj);
        this.RECEPTIONIST_URL = RECEPTIONIST_URL;
    }
}


module.exports = {
    instance: new ReceptionRequest({
        collection: "receptionists",
        baseUrl   : "/receptionist/",
        role      : "receptionist",
        id        : "receptionistId"
    }),
    ReceptionRequest
};
