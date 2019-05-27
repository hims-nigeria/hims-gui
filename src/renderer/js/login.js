; ( () => {
    "use strict";

    const { remote: { getCurrentWindow , dialog } } = require("electron");
    const { login } = require("../js/requests.js");

    const form   = document.querySelector("form");
    const submit = document.querySelector("[type=submit]");
    const reset  = document.querySelector("[type=reset]");

    const register = document.querySelector(".user-register");

    const { REGISTER_URL , ADMIN_URL } = require("../js/constants.js");

    form.addEventListener("submit", async evt => {

        evt.preventDefault();

        if ( ! form.checkValidity() ) {
            dialog.showErrorMessage("Incorrect inputs","All fields are required and should be filled appropriately");
            return;
        }

        submit.disabled = true;
        reset.disabled  = true;

        const result = await login(new FormData(form), { disabled: [ submit, reset ], nextUrl:  ADMIN_URL });
        console.log(result,"hi there");
        if ( result ) getCurrentWindow().webContents.loadURL(ADMIN_URL);

    });

    register.addEventListener("click", evt => {
        getCurrentWindow().loadURL(REGISTER_URL);
    });

})();
