"use strict";

const { remote: { app } } = require("electron");

const APP_PATH = app.getAppPath();
const SUBDIR   = "src/renderer/html";

module.exports.LOGIN_URL = `file://${APP_PATH}/${SUBDIR}/login.html`;
module.exports.ADMIN_URL = `file://${APP_PATH}/${SUBDIR}/admin_section.html`,
module.exports.REGISTER_URL = `file://${APP_PATH}/${SUBDIR}/register.html`;
module.exports.ADD_NURSE_URL = `file://${APP_PATH}/${SUBDIR}/admin/admin_nurse.html`;
module.exports.NOT_MAIN_WINDOW_URL = `file://${APP_PATH}/${SUBDIR}/not_main_window.html`;
module.exports.ADD_RECEPTIONIST_URL = `file://${APP_PATH}/${SUBDIR}/admin/admin_receptionist.html`;

module.exports.PAGE_LIMIT = 25;

module.exports.REQUEST_URL = process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : "protocol://host:port";
