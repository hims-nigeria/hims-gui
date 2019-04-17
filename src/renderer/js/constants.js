"use strict";

const { remote: { app } } = require("electron");

const APP_PATH = app.getAppPath();
const SUBDIR   = "src/renderer/html";

module.exports.LOGIN_URL = `file://${APP_PATH}/${SUBDIR}/login.html`;
module.exports.ADMIN_URL = `file://${APP_PATH}/${SUBDIR}/admin_section.html`,
module.exports.REGISTER_URL = `file://${APP_PATH}/${SUBDIR}/register.html`;
