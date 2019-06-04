; ( () => {

    "use strict";


    const { remote: { getCurrentWindow , dialog } } = require("electron");
    const { instance } = require("../js/admin/adminRequest.js");

    const statesAndCapital = require("../assets/stateandcapital.json");
    const { toast } = require("../js/domutils.js");

    const healthCareStates = document.querySelector("[name=state]");
    const healthCareLgas   = document.querySelector("[name=lga]");

    const form         = document.querySelector("form");
    const registerBtns = document.querySelectorAll("button");

    const { ADMIN_URL } = require("../js/constants.js");


    window.addEventListener("DOMContentLoaded", () => {
        statesAndCapital.forEach( ({state}) => {
            console.log(state);
            const option = document.createElement("option");
            option.setAttribute("data-state-id", state.id);
            option.textContent = option.value = state.name;
            healthCareStates.appendChild(option);
        });
    });

    healthCareStates.addEventListener("input", evt => {

        const { target } = evt;

        for ( let i = 1 ; i < healthCareLgas.length ; i++ ) healthCareLgas.options[i].remove();

        statesAndCapital.find( ({state}) => state.name == target.value).state.locals.forEach( lga => {
            const option = document.createElement("option");
            option.setAttribute("data-lga-id", lga.id);
            option.textContent = option.value = lga.name;
            healthCareLgas.appendChild(option);
        });
    });


    form.addEventListener("submit", async evt => {

        evt.preventDefault();

        if ( ! form.checkValidity() ) {
            dialog.showErrorBox("Invalid inputs","All fields are required");
            return;
        }

        registerBtns.forEach( x => x.disabled = true);

        const result =  await instance.register(new FormData(form) , { disabled: Array.from(registerBtns) , nextUrl: ADMIN_URL } );

        if ( result ) getCurrentWindow().webContents.loadURL(ADMIN_URL);

    });

})();
