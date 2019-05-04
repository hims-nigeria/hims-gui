
"use strict";

const { remote: { getCurrentWindow } } = require("electron");
const { PAGE_LIMIT } = require("../js/constants.js");
const axios = require("axios");
const hospitalDb = require("../js/db.js");

const { toast } = require("../js/domutils.js");


const {
    formDataToObject,
    createExternalId,
    isEmailExists
} = require("../js/utils.js");

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

module.exports.saveUserInfo = async ({ data , obj , collection } ) => {

    const OBJECT_TO_CACHE = {};

    const hpwd = await formDataToObject(data,OBJECT_TO_CACHE);

    if ( ! hpwd ) {
        toast({
            text: "Registration of patient failed. Retry creating patient",
            createAfter: 0
        });
        return false;
    }

    OBJECT_TO_CACHE.role = data.get("role");
    OBJECT_TO_CACHE.password = hpwd;
    OBJECT_TO_CACHE.image = (new TextEncoder()).encode(obj.dataUri);


    const result = await isEmailExists( OBJECT_TO_CACHE.email );

    if ( result.length ) {
        toast({
            text: `${OBJECT_TO_CACHE.email} is not avaiable`,
            createAfter: 5000
        });
        return false;
    }

    const [ { healthFacilityId } ] = await hospitalDb.sessionObject.toArray();

    OBJECT_TO_CACHE[obj.idType] = createExternalId(
        OBJECT_TO_CACHE.email,
        OBJECT_TO_CACHE.phoneNumber,
        Date.now()
    );

    OBJECT_TO_CACHE.healthFacility = healthFacilityId;

    await hospitalDb[collection].add(OBJECT_TO_CACHE);

    await hospitalDb.healthFacility.where({ healthFacilityId }).modify( result => {
        result.dashboardInfo[collection] += 1;
    });

    if ( ! result.response ) {
        await hospitalDb.offlineAccounts.add({ ...OBJECT_TO_CACHE , newInformationType: collection , flag: "new" });
    }

    return OBJECT_TO_CACHE;
};

module.exports.editUserInfo = async ({ result , data , obj , collection , idType}) => {

    const OBJECT_TO_CACHE = {};
    const hpwd = await formDataToObject(data,OBJECT_TO_CACHE);

    if ( ! hpwd ) {
        toast({
            text: "Registration of patient failed. Retry creating patient",
            createAfter: 0
        });
        return false;
    }

    OBJECT_TO_CACHE.image = (new TextEncoder()).encode(obj.dataUri);
    OBJECT_TO_CACHE.password = hpwd;

    const resEmail = await isEmailExists(OBJECT_TO_CACHE.email);

    if ( resEmail[0].email !== OBJECT_TO_CACHE.email ) {
        toast({
            text: `${resEmail[0].email} does not exists`,
            createAfter: 5000
        });
        return false;
    }

    const userId = OBJECT_TO_CACHE[idType];

    delete OBJECT_TO_CACHE[idType];
    await hospitalDb[collection].where({ [idType]: userId }).modify(OBJECT_TO_CACHE);

    if ( ! result.response ) {

        await hospitalDb.offlineAccounts.where(
            {
                newInformationType: collection
            }
        ).and(
            x => x[idType] === userId
        ).modify(
            {
                ...OBJECT_TO_CACHE,
                flag: "edit"
            }
        );
    }

    return true;
};
