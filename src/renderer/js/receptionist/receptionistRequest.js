"use strict";

const { AdminRequest } = require("../admin/adminRequest.js");
const { RECEPTIONIST_URL } = require("../constants.js");

class ReceptionRequest extends AdminRequest {

    constructor(role,baseUrl) {
        super(role,baseUrl);
        this.RECEPTIONIST_URL = RECEPTIONIST_URL;
    }

}


module.exports = {
    instance: new ReceptionRequest("/receptionist/", "receptionist"),
    ReceptionRequest
};
