; ( () => {

    "use strict";

    const {
        ipcRenderer: ipc,
        remote: { getCurrentWindow, dialog }
    } = require("electron");

    const {
        setupEventOnDomLoad,
        addUserFormHandler
    } = require("../../js/utils.js");

    const {
        adminCreateIntervention,
        adminEditIntervention
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
            ipcEventName: undefined,
            generateIdFrom: undefined
        }
    };


    form.addEventListener("submit", evt => addUserFormHandler(FORM_STATE,{
        evt,
        saveUser: async (fData,btns) => {
            return await adminCreateIntervention(  fData , {
                disabled  : btns,
                ...FORM_STATE.__newWindowSpec
            });
        },
        editUser: async (fData,btns) => {
            return await adminEditIntervention( fData , {
                disabled   : btns,
                ...FORM_STATE.__newWindowSpec
            });
        }
    }));

    window.addEventListener("DOMContentLoaded", () => setupEventOnDomLoad( FORM_STATE ));

    close.addEventListener("click", () => getCurrentWindow().close() );

})();
