; ( () => {

    "use strict";

    const {
        setupEventOnDomLoad,
        addUserFormHandler,
        loadImageToDom
    } = require("../../js/admin/utils.js");

    const { saveNurse , editNurse } = require("../../js/requests.js");
    const { NOT_MAIN_WINDOW_URL } = require("../../js/constants.js");

    const hospitalDb = require("../../js/db.js");

    const selectImage   = document.querySelector(".select-image");
    const previewImage  = document.querySelector(".previewer");
    const fileLoader    = document.querySelector("[type=file]");

    const form = document.querySelector(".admin-add-user-form");

    const fileReader = new FileReader();


    let FORM_STATE , DATA_URL, NURSE_ID ;

    selectImage.addEventListener("click", () => {
        fileLoader.click();
    });

    fileLoader.addEventListener("input", evt => loadImageToDom({
        file: evt.target.files[0],
        fileReader
    }));

    form.addEventListener("submit", evt => addUserFormHandler({
        _id: { name: "nurseId", value: NURSE_ID },
        ipcEventName: "admin-nurse",
        FORM_STATE,
        evt,
        saveUser: async (fData,btns) => {
            return await saveNurse(  fData , {
                disabled: btns,
                dataUri: previewImage.src
            });
        },
        editUser: async (fData,btns) => {
            return await editNurse( fData , {
                disabled : btns,
                dataUri  : previewImage.src
            });
        }
    }));

    window.addEventListener("DOMContentLoaded", () => setupEventOnDomLoad( NURSE_ID , {
        title: "Add Nurse",
        idType: "nurseId",
        collection: "nurses",
        FORM_STATE
    }));

})();
