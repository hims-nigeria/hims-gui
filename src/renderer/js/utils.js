"use strict";

const util = require("util");
const https = require("https");
const bcrypt = require("bcrypt");

module.exports.checkForInternet = async cb => https.get("https://google.com", res => cb(res,null)).on("error", e => cb(null,e) );

module.exports.hashPassword = async (pwd, cpwd) => {
    if ( pwd !== cpwd ) return false;
    try { return await bcrypt.hash( pwd , 10 ); } catch(ex) { return ex; }
};

module.exports.comparePassword = async ( plaintextPwd, hashedPwd )  => {
    try {
        return (await bcrypt.compare( plaintextPwd, hashedPwd ));
    } catch(ex) {
        return ex;
    }
};

module.exports.createExternalId = (...criteria) => {
    const crypto = require("crypto");
    return crypto.createHash("sha1").update(criteria.join("")).digest("hex");
};
