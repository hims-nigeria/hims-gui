; ( () => {

    "use strict";

    const {
        setupEventOnDomLoad,
        addUserFormHandler,
        loadImageToDom
    } = require("../../js/utils.js");

    const { adminSaveUser , adminEditUser } = require("../../js/requests.js");

    const hospitalDb = require("../../js/db.js");

    const selectImage   = document.querySelector(".select-image");
    const previewImage  = document.querySelector(".previewer");
    const fileLoader    = document.querySelector("[type=file]");

    const form = document.querySelector(".admin-add-user-form");

    const fileReader = new FileReader();


    const FORM_STATE = {
        state  : undefined,
        userId : undefined,
        __newWindowSpec: {
            idType: undefined,
            collection: undefined,
            url: undefined
        }
    };

    selectImage.addEventListener("click", () => {
        fileLoader.click();
    });

    fileLoader.addEventListener("input", evt => loadImageToDom({
        file: evt.target.files[0],
        fileReader
    }));

    form.addEventListener("submit", evt => addUserFormHandler(FORM_STATE,{
        _id: { name: "nurseId", value: FORM_STATE.userId },
        ipcEventName: "admin-nurse",
        role: "nurse",
        evt,
        saveUser: async (fData,btns) => {
            return await adminSaveUser(  fData , {
                disabled  : btns,
                dataUri   : previewImage.src,
                ...FORM_STATE.__newWindowSpec
            });
        },
        editUser: async (fData,btns) => {
            return await adminEditUser( fData , {
                disabled   : btns,
                dataUri    : previewImage.src,
                ...FORM_STATE.__newWindowSpec
            });
        }
    }));

    window.addEventListener("DOMContentLoaded", () => setupEventOnDomLoad( FORM_STATE ));

})();
