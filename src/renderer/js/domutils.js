"use script";

module.exports.toast = ( { text , createAfter, deleteAfter } ) => {

    const animateProperties = [
        { right: "5px"  },
        { right: "10px" },
        { right: "15px" },
        { right: "20px" },
        { right: "25px" },
        { right: "30px" },
        { right: "35px" },
        { right: "40px" }
    ];

    setTimeout( () => {

        const toastParent = document.createElement("div");
        const toastClose  = document.createElement("p");
        const toastText   = document.createElement("p");


        toastParent.classList.add("toast-parent");
        toastClose.classList.add("toast-close");
        toastClose.classList.add("fa");
        toastClose.classList.add("fa-times");
        toastText.classList.add("class", "toast-text");

        toastClose.addEventListener("click", () => toastParent.remove());

        toastParent.appendChild(toastText);
        toastParent.appendChild(toastClose);

        toastText.textContent = text;

        document.body.appendChild(toastParent);

        setTimeout( () => {
            toastParent.animate( Array.from(animateProperties).reverse(), {
                duration: 100,
                fill: "forwards"
            });

        } , 5000 );

        setTimeout( () => {
            toastParent.remove();
        },5100);

        toastParent.animate( animateProperties , {
            duration: 100,
            fill: "forwards"
        });

    }, createAfter );
};

module.exports.spinner = () => {

    const spinnerParent = document.createElement("div");
    const spinner = document.createElement("i");

    spinner.classList.add("fa");
    spinner.classList.add("fa-spinner");
    spinner.classList.add("fa-pulse");
    spinner.classList.add("fa-5x");

    spinner.style.color = "black";

    Object.assign( spinnerParent.style, {
        display: "flex",
        justifyContent: "center",
        position: "relative",
        top: "250px"
    });

    spinnerParent.appendChild(spinner);

    return spinnerParent;
};
