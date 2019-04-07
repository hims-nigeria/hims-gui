"use script";

module.exports.toast = ( { text , createAfter, deleteAfter } ) => {

    setTimeout( () => {
        
        const toastParent = document.createElement("div");
        const toastClose  = document.createElement("p");
        const toastText   = document.createElement("p");
    

        toastParent.classList.add("toast-parent");
        toastClose.classList.add("toast-close");
        toastClose.classList.add("fa");
        toastClose.classList.add("fa-times");
        toastText.classList.add("class", "toast-text");

        toastParent.appendChild(toastClose);
        toastParent.appendChild(toastText);

        toastText.textContent = text;

        document.body.appendChild(toastParent);

        setTimeout( () => {
            toastParent.remove();
        } , 5000 );
        
    }, createAfter );
};
