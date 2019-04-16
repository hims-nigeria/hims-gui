; ( () => {
    
    "use strict";

    const toggler = document.querySelector(".nav-header-toggler");
    const asideNav = document.querySelector(".section-nav");
    const navOperations = document.querySelector(".section-nav-operation");

    const { getDashboard } = require("../js/requests.js");
    const { LOGIN_URL } = require("../js/constants.js");
    
    toggler.addEventListener("click", evt => {
        if ( asideNav.hasAttribute("data-hide-nav") ) {
            asideNav.removeAttribute("data-hide-nav");
            asideNav.removeAttribute("style");
            navOperations.removeAttribute("style");
            return;
        }
        asideNav.setAttribute("data-hide-nav", true);
        asideNav.style.width = "10%";
        navOperations.style.width = "90%";    
    });

    window.addEventListener("DOMContentLoaded", async () => {
        const result = await getDashboard({
            nextUrl: LOGIN_URL
        });
        console.log(result);
    });
    
})();
