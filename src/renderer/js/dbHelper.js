
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

        const f = await hospitalDb[collection].where({healthFacility : healthFacilityId}).toArray();
        console.log(f);

        Object.assign(__users[collection], {
            hasMore: await cursor.count() > ((obj.PAGE + 1) * PAGE_LIMIT),
            [collection]: await cursor.offset(PAGE_LIMIT * obj.PAGE).limit(PAGE_LIMIT).toArray(),
            fullName,
            role
        });
        console.log(__users , collection);
    }
    return Object.keys(__users[collection]).length ? __users[collection] : result.response.data.message;
};



module.exports.deleteUserInfo = async ({data,idType,result,collection} , cb ) => {

    const [  { healthFacilityId }  ] = await hospitalDb.sessionObject.toArray();

    await hospitalDb[collection].where({ [idType]: data[idType] }).delete();

    if ( cb )
        await cb(healthFacilityId);

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

module.exports.saveUserInfo = async ({ data , obj , collection , result: apiResult } ) => {

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

    if ( ! /^\s$/.test(obj.dataUri) )
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

    if ( ! apiResult.response )
        await hospitalDb.offlineAccounts.add({
            newInformationType: collection,
            ...OBJECT_TO_CACHE,
            flag: "new"
        });

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


    if ( ! /^\s{0,}$/.test(obj.dataUri) )
        OBJECT_TO_CACHE.image = (new TextEncoder()).encode(obj.dataUri);

    if ( ! /^\s{0,}$/.test(data.get("password")) ) OBJECT_TO_CACHE.password = hpwd;

    const userId = OBJECT_TO_CACHE[idType];

    const resEmail = await isEmailExists(OBJECT_TO_CACHE.email);

    if ( resEmail.length ) {

        const [ { role , email } ] = resEmail;
        const __dbUserId  = resEmail[0][idType];

        let error = 0;

        /**
         * when the collection is the same as the user role(s)
         * if the userid is different then we show a message of
         * email unavailability
         * if the role is different from the collection we still show the same message
         *
         * in a situation where the roles are the same and the userId is the same
         * no need to show an error message , probably the admin only edited
         * one information other than the email
         **/

        if ( collection === `${role}s` && userId !== __dbUserId ) error = 1;
        if ( collection !== `${role}s` ) error = 1;

        if ( error ) {
            toast({
                text: `${OBJECT_TO_CACHE.email} is not avaiable`,
                createAfter: 5000
            });
            return false;
        }

    }

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

module.exports.saveInterventionInfo = async ({ result , data , obj }) => {

    const OBJECT_TO_CACHE = {};

    for ( let [ key , value ] of data.entries() )
        OBJECT_TO_CACHE[key] = value;

    const [ { healthFacilityId } ] = await hospitalDb.sessionObject.toArray();
    console.log(Object.values(obj.generateIdFrom));
    const __id = createExternalId(
        OBJECT_TO_CACHE.healthFacilityId,
        ...Object.values(obj.generateIdFrom)
        // OBJECT_TO_CACHE.interventionName,
        // OBJECT_TO_CACHE.subInterventionName
    );

    if ( ! result.response ) {

        if ( await hospitalDb[obj.collection].get({ [obj.idType]: __id }) ) {
            toast({
                text: `Intervention is not available`,
                createAfter: 6000
            });
            return false;
        }

        await hospitalDb.offlineAccounts.add({
            newInformationType: obj.collection,
            ...OBJECT_TO_CACHE,
            flag: "new"
        });
    }

    OBJECT_TO_CACHE.healthFacility   = healthFacilityId;
    OBJECT_TO_CACHE[obj.idType]      = __id;

    await hospitalDb[obj.collection].add(OBJECT_TO_CACHE);

    return true;
};

module.exports.editInterventionInfo = async ({ result , data , obj , collection , idType}) => {

    const OBJECT_TO_CACHE = {};

    for ( let [ key , value ] of data.entries() )
        OBJECT_TO_CACHE[key] = value;

    const userId = OBJECT_TO_CACHE[idType];

    if ( ! ( await hospitalDb[collection].get({ [idType] : userId })) ) {
        toast({
            text: `intervention is not avaiable`,
            createAfter: 5000
        });
        return false;
    }

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
