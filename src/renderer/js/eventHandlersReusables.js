"use strict";

module.exports.navigation = function (location)  {

    const prevIcon = document.querySelector(".prev");
    const nextIcon = document.querySelector(".next");

    if ( location === "prev" && this.nurse.__first__page === 0 ) {
        prevIcon.classList.add("no-more");
        nextIcon.classList.remove("no-more");
        return;
    }

    if ( location === "next" && ! this.nurse.hasMore ) {
        nextIcon.classList.add("no-more");
        prevIcon.classList.remove("no-more");
        return;
    }
};
