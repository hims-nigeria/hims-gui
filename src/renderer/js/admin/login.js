; ( () => {
    "use strict";

    const { remote: { getCurrentWindow , dialog } } = require("electron");
    const { instance } = require("../js/admin/adminRequest.js");

    const form   = document.querySelector("form");
    const submit = document.querySelector("[type=submit]");
    const reset  = document.querySelector("[type=reset]");

    const register = document.querySelector(".user-register");
    const constants = require("../js/constants.js");

    const { AdminRequest } = require("../js/admin/adminRequest.js");

    form.addEventListener("submit", async evt => {

        evt.preventDefault();

        if ( ! form.checkValidity() ) {
            dialog.showErrorMessage("Incorrect inputs","All fields are required and should be filled appropriately");
            return;
        }

        submit.disabled = true;
        reset.disabled  = true;

        const result = await AdminRequest.LoginUniqueUser(new FormData(form), { disabled: [ submit, reset ], nextUrl:  constants.LOGIN_URL });

        if ( result ) {
            console.log(result);
            getCurrentWindow().webContents.loadURL(constants[`${result.role.toUpperCase()}_URL`]);
        }

    });

    register.addEventListener("click", evt => {
        getCurrentWindow().loadURL(constants.REGISTER_URL);
    });

})();
