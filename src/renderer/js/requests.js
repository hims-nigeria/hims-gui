"use strict";

const axios = require("axios");

const REQUEST_URL = process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : "protocol://host:port";
      

module.exports.getDashboard = async section => {
    try {
        return await axios.get(`${REQUEST_URL}/${section}/dashboard/`);
    } catch(ex) {
        return ex;
    }
};
