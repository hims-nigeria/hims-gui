"use strict";

const util = require("util");
const https = require("https");

module.exports.checkForInternet = async cb => https.get("https://google.com", res => cb(res,null)).on("error", e => cb(null,e) );
