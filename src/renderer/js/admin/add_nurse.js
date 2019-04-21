; ( () => {

    "use strict";

    const {
        ipcRenderer: ipc,
        remote: {
            dialog
        }
    } = require("electron");

    const { saveNurse } = require("../../js/requests.js");
    const { NOT_MAIN_WINDOW_URL } = require("../../js/constants.js");

    const selectImage   = document.querySelector(".select-image");
    const previewParent = document.querySelector(".image-preview");
    const previewImage  = document.querySelector(".previewer");
    const imageText     = document.querySelector(".image-preview-text");
    const fileLoader    = document.querySelector("[type=file]");

    const form = document.querySelector(".admin-add-nurse-form");

    const fReader = new FileReader();

    selectImage.addEventListener("click", () => {
        fileLoader.click();
    });


    fileLoader.addEventListener("input", evt => {
        fReader.readAsDataURL(evt.target.files[0]);
        fReader.addEventListener("load", evt => {
            imageText.style.display = "none";
            previewParent.style.padding = "unset";
            previewImage.src = evt.target.result;
            previewImage.style.display = "block";
        });
    });

    form.addEventListener("submit", async evt => {

        evt.preventDefault();

        if ( ! form.checkValidity() ) {
            dialog.showErrorBox("Something does not feel right","Please correct the wrong fields");
            return;
        }

        const btns = Array.from(document.querySelectorAll("button"));

        btns.forEach( x => x.disabled = true );

        const result = await saveNurse( new FormData(form) , {
            disabled: btns,
            dataUri: previewImage.src
        });

        if ( ! result ) return;

        ipc.sendTo( 1 , "admin-nurse");

    });

})();
