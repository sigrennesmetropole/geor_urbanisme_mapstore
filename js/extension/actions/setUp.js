/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const SET_UP = "URBANISME:SET_UP";
export const SET_CONFIG = "URBANISME:SET_CONFIG";

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
export const setConfiguration = config => {
    return {
        type: SET_CONFIG,
        config
    };
};
