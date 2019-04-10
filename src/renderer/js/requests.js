"use strict";

const { remote: { getCurrentWindow } } = require("electron");
const axios = require("axios");
const qs    = require("querystring");
const { toast } = require("../js/domutils.js");

const REQUEST_URL = process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : "protocol://host:port";

const apiCallError = (result,obj) => {
    
    if ( obj.disabled ) obj.disabled.forEach( el => el.disabled = false );

    if ( ! result.response ) {

        toast({
            text: "Oops. We can't communicate with server now. All changes will be saved offline",
            createAfter : 0
        });


        setTimeout(() => {
            getCurrentWindow().webContents.loadURL(obj.nextUrl);
        },6000);

        return;
    }

    if ( result.response.data.status === 404 ) {
        toast({
            text: result.response.data.message
        });
        return;
    }
    
    getCurrentWindow().webContents.loadURL(obj.nextUrl);
    
    return;
};

module.exports.getDashboard = async obj => {
    try {
        return await axios.get(`${REQUEST_URL}/dashboard/`);
    } catch(ex) {
        return apiCallError(ex,obj);
    }
};

module.exports.login = async (data,obj) => {
    try {
        return await axios.post(`${REQUEST_URL}/login/`, qs.stringify(data) );
    } catch(ex) {
        return apiCallError(ex,obj);
    }
};
