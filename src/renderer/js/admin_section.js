; ( () => {

    "use strict";

    const toggler = document.querySelector(".nav-header-toggler");
    const asideNav = document.querySelector(".section-nav");
    const navOperations = document.querySelector(".section-nav-operation");


    const navList = document.querySelector(".nav-list");

    const admin = require("../js/admin.js");

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
        //admin.emit("admin-dashboard");
        admin.emit("admin-nurse");
    });

    navList.addEventListener("click", evt => {
        
        let { target } = evt;

        if ( target instanceof HTMLUListElement ) return;
            
        if ( ! (target instanceof HTMLLIElement) )
            target = target.parentNode;

        const eventName = target.getAttribute("data-fire");
        admin.emit(eventName);
    });

})();
