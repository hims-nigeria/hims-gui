"use strict";

module.exports.navigation = function (location,property)  {

    const prevIcon = document.querySelector(".prev");
    const nextIcon = document.querySelector(".next");
    console.log(property, "duhadfasdf");
    if ( location === "prev" && property.__first__page === 0 ) {
        prevIcon.classList.add("no-more");
        nextIcon.classList.remove("no-more");
        return;
    }
    
    if ( location === "next" && ! property.hasMore ) {
        nextIcon.classList.add("no-more");
        prevIcon.classList.remove("no-more");
        return;
    }
};
