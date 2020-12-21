// this file contains configurations for dev proxy

const DEV_PROTOCOL = "http";
const DEV_HOST = "localhost:8080";

module.exports = {
    "/rest": {
        target: `${DEV_PROTOCOL}://${DEV_HOST}/mapstore`,
        secure: false,
        headers: {
            host: `${DEV_HOST}`
        }
    },
    "/pdf": {
        target: `${DEV_PROTOCOL}://${DEV_HOST}/mapstore`,
        secure: false,
        headers: {
            host: `${DEV_HOST}`
        }
    },
    "/mapstore/pdf": {
        target: `${DEV_PROTOCOL}://${DEV_HOST}`,
        secure: false,
        headers: {
            host: `${DEV_HOST}`
        }
    },
    "/proxy": {
        target: `${DEV_PROTOCOL}://${DEV_HOST}/mapstore`,
        secure: false
    },
    "/mapstore/proxy": {
        target: `${DEV_PROTOCOL}://${DEV_HOST}`,
        secure: false
    },
    "/geonetwork": {
        target: `${DEV_PROTOCOL}://${DEV_HOST}/geonetwork`,
        secure: false,
        headers: {
            host: `${DEV_HOST}`
        }
    },
    "/header": {
        target: `${DEV_PROTOCOL}://${DEV_HOST}`,
        secure: false,
        headers: {
            host: `${DEV_HOST}`
        }
    },
    "/cadastrapp": {
        target: `https://georchestra.geo-solutions.it`,
        secure: false,
        headers: {
            host: `georchestra.geo-solutions.it`
        }
    }
};