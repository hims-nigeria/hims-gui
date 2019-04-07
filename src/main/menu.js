"use strict";

const { Menu } = require("electron");

Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
        label: "File",
        submenu: [{
            role: "separator"
        }]
    }
]));
