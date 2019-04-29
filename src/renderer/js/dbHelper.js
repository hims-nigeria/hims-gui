
"use strict";

const { remote: { getCurrentWindow } } = require("electron");
const { PAGE_LIMIT } = require("../js/constants.js");
const axios = require("axios");
const hospitalDb = require("../js/db.js");

module.exports.loadUsersInfo = async ({result,collection,obj}) => {

    const __users = { [collection]: {} };

    if ( ! result.response ) {

        const session = await hospitalDb.sessionObject.toArray();

        if ( ! session.length ) {
            getCurrentWindow().webContents.loadURL(obj.nextUrl);
            return false;
        }

        const [ { role , fullName, healthFacilityId } ] = session;

        const cursor = hospitalDb[collection].where({healthFacility : healthFacilityId});

        Object.assign(__users[collection], {
            hasMore: await cursor.count() > ((obj.PAGE + 1) * PAGE_LIMIT),
            [collection]: await cursor.offset(PAGE_LIMIT * obj.PAGE).limit(PAGE_LIMIT).toArray(),
            fullName,
            role
        });
        console.log(__users[collection]);
    }
    return Object.keys(__users[collection]).length ? __users[collection] : result.response.data.message;
};



module.exports.deleteUserInfo = async ({data,idType,result,collection}) => {

    const [  { healthFacilityId }  ] = await hospitalDb.sessionObject.toArray();
    await hospitalDb[collection].where({ [idType]: data[idType] }).delete();
    await hospitalDb.healthFacility.where({ healthFacilityId }).modify( result => {
        result.dashboardInfo[collection] -= 1;
    });

    if ( ! result.response ) {
        await hospitalDb.offlineAccounts.where(
            {
                newInformationType: collection
            }
        ).and(
            x => x[idType] === data[idType]
        ).modify(
            {
                flag: "delete"
            }
        );
    }
    return true;
};
