/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

export const SET_UP = "URBANISME:SET_UP";
export const SET_CONFIG = "URBANISME:SET_CONFIG";
export const LOADING = "URBANISME:LOADING";

/**
* Signals the beginning of set up, like loading config for the urbanisme extension/plugin
* @memberof actions.setUp
* @return {object} with type `SET_UP`
*/
export const setUp = () => {
    return {
        type: SET_UP
    };
};

/**
* Sets the configuration into state of the urbanisme extension/plugin
* @memberof actions.setUp
* @return {object} with type `SET_CONFIG` and config object
*/
export const setConfiguration = (config) => {
    return {
        type: SET_CONFIG,
        config
    };
};

/**
* Sets the status of loading of a resource called "name" and "value" as the information status
* @memberof actions.setUp
* @param {boolean} value loading status
* @param {string}  name the name of the resource being loaded
* @return {object} with type `LOADING`
*/
export const loading = (value, name) => ({
    type: LOADING,
    value,
    name
});
