; ( () => {
    
    "use strict";

    const { checkForInternet } = require("../js/utils.js");
    const { toast } = require("../js/domutils.js");

    window.addEventListener("DOMContentLoaded", async () => {
        
        const id = setInterval( () => {
            const spinDots = document.querySelector(".spin-dots");
            const temp = spinDots.innerHTML;
            spinDots.innerHTML = temp;
        } , 6000);
        
        checkForInternet((res,error) => {
            clearInterval(id);
            if ( error ) {
                toast({ text: "Yikes. You are not Connected to the Internet" , createAfter : 0 });
                toast({ text: "Loading information from local database" , createAfter: 5000 });
                return;
            }
            console.log("Connected");
        });
    });
    
})();
