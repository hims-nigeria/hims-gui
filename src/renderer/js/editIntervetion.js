; ( () => {

    "use strict";

    const {
        ipcRenderer: ipc,
        remote: { getCurrentWindow, dialog }
    } = require("electron");

    const {
        setupEventOnDomLoad
    } = require("../../js/utils.js");

    const {
        adminCreateIntervention
    } = require("../../js/requests.js");

    const form  = document.querySelector("form");
    const close = document.querySelector(".close");

    const FORM_STATE = {
        state  : undefined,
        userId : undefined,
        __newWindowSpec: {
            idType: undefined,
            collection: undefined,
            url: undefined,
            ipcEventName: undefined
        }
    };



    form.addEventListener("submit", async evt => {

        evt.preventDefault();

        if ( ! form.checkValidity() ) {
            dialog.showErrorBox("Something does not feel right","Please correct the wrong fields");
            return;
        }

        const fData  = new FormData(evt.target);
        const btns   = Array.from(document.querySelectorAll("button"));

        btns.forEach( x => x.disabled = true );

        const result = await adminCreateIntervention(fData,{
            disabled: btns,
            generateIdFrom: {
                interventionName: fData.get("interventionName")
            },
            idType: "interventionId",
            collection: "interventions"
        });

        if ( ! result ) return;

        ipc.sendTo( 1 , FORM_STATE.__newWindowSpec.ipcEventName);

    });

    window.addEventListener("DOMContentLoaded", () => setupEventOnDomLoad( FORM_STATE ));

    close.addEventListener("click", () => getCurrentWindow().close() );

})();
