; ( () => {
    "use strict";

    const { remote: { dialog } } = require("electron");
    const { login } = require("../js/requests.js");
    
    const form   = document.querySelector("form");
    const submit = document.querySelector("[type=submit]");
    const reset  = document.querySelector("[type=reset]");

    const { DASHBOARD_URL } = require("../js/constants.js");

    form.addEventListener("submit", async evt => {
        
        evt.preventDefault();
        
        if ( ! form.checkValidity() ) {
            dialog.showErrorMessage("Incorrect inputs","All fields are required and should be filled appropriately");
            return;
        }
        
        submit.disabled = true;
        reset.disabled  = true;

        const result = await login(
            {
                email: document.querySelector("[name=email]").value,
                password: document.querySelector("[name=password]").value
            },
            {
                disabled: [ submit, reset ],
                nextUrl:  DASHBOARD_URL
            }
        );
        
    });
    
})();
