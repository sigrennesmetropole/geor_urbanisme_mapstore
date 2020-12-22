/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

export const SET_UP = "URBANISME:SET_UP";
export const SET_CONFIG = "URBANISME:SET_CONFIG";

export const setUp = () => {
    return {
        type: SET_UP
    };
};

export const setConfiguration = (config) => {
    return {
        type: SET_CONFIG,
        config
    };
};
