/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {printError} from "@mapstore/actions/print";

import {getUrbanismePrintSpec, retryDownload} from "../utils/UrbanismeUtils";
import {printPDF} from "@js/extension/api";

export * from "./setUp";
export const TOGGLE_TOOL = "URBANISME:TOGGLE_TOOL";
export const TOGGLE_VIEWER_PANEL = "URBANISME:TOGGLE_VIEWER_PANEL";
export const SET_URBANISME_DATA = "URBANISME:SET_URBANISME_DATA";
export const LOADING = "URBANISME:LOADING";
export const URBANISME_FEATURE_INFO_CLICK = 'URBANISME:FEATURE_INFO_CLICK';
export const URBANISME_HIGHLIGHT_FEATURE = 'URBANISME:HIGHLIGHT_FEATURE';
export const URBANISME_RESET_FEATURE_HIGHLIGHT = 'URBANISME:RESET_FEATURE_HIGHLIGHT';

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

/**
 * Sets the activeTool for urbanisme toolbar
 * @memberof actions.toggleUrbanismeTool
 * @param {string} tool name to active
 * @return {object} with type `TOGGLE_TOOL`
 */
export const toggleUrbanismeTool = tool => {
    return {
        type: TOGGLE_TOOL,
        activeTool: tool
    };
};

/**
 * Sets the attributes property of NRU/ADS data
 * @memberof actions.setAttributes
 * @param {object} property name and value of attribute to be saved
 * @return {object} with type `SET_URBANISME_DATA`
 */
export const setAttributes = (property = {}) => {
    return {
        type: SET_URBANISME_DATA,
        property
    };
};

/**
 * Sets the state of the viewer panel (open/close)
 * @memberof actions.toggleGFIPanel
 * @param {boolean} enabled state of the viewer panel
 * @return {object} with type `TOGGLE_VIEWER_PANEL`
 */
export const toggleGFIPanel = enabled => {
    return {
        type: TOGGLE_VIEWER_PANEL,
        enabled
    };
};

/**
 * Sets the print specification including attributes and params for printing to PDF
 * @memberof actions.printSubmit
 * @param {object} attributes of the NRU/ADS data to be printed onto the PDF
 * @return dispatch actions
 */
export const printSubmit = attributes => {
    return (dispatch, getState) => {
        const state = getState() || {};
        const {outputFilename, layout = "A4 portrait", ...dataAttributes} =
        attributes || {};
        const {
            layers,
            scaleForZoom,
            projectedCenter,
            dpi,
            projection
        } = getUrbanismePrintSpec(state);
        const params = {
            layout,
            outputFilename,
            attributes: {
                map: {
                    scale: scaleForZoom,
                    center: [projectedCenter.x, projectedCenter.y],
                    dpi,
                    layers,
                    projection
                },
                ...dataAttributes
            }
        };
        dispatch(loading(true, "printing"));
        return printPDF(params)
            .then(response => retryDownload(response, outputFilename))
            .then(() => dispatch(loading(false, "printing")))
            .catch(e => {
                dispatch(printError("Error on reading print result: " + e.data));
                dispatch(loading(false, "printing"));
            });
    };
};

/**
 * Carries data needed for Get Feature Info request
 * @param {object} point point clicked in this shape {latlng: {lat:1, lng:2}, pixel:{x:33 y:33}, modifiers:{} }
 * @param {string} layer the name of the layer without workspace
 * @param {object[]} [filterNameList=[]] list of layers to perform the GFI request
 * @param {object} [overrideParams={}] a map based on name as key and object as value for overriding request params
 * @param {string} [itemId=null] id of the item needed for filtering results
 */
export function featureInfoClick(point, layer, filterNameList = [], overrideParams = {}, itemId = null) {
    return {
        type: URBANISME_FEATURE_INFO_CLICK,
        point,
        layer,
        filterNameList,
        overrideParams,
        itemId
    };
}


export function highlightFeature(point, feature, featureCrs) {
    return {
        type: URBANISME_HIGHLIGHT_FEATURE,
        point,
        feature,
        featureCrs
    };
}

export function resetFeatureHighlight() {
    return {
        type: URBANISME_RESET_FEATURE_HIGHLIGHT
    };
}
