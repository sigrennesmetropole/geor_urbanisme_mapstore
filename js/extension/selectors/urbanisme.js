/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {createStructuredSelector} from 'reselect';

import {additionalLayersSelector} from "@mapstore/selectors/additionallayers";

import {LAYER_STYLES, URBANISME_RASTER_LAYER_ID, URBANISME_VECTOR_LAYER_ID} from "../constants";

import {get} from 'lodash';
import {mapSelector} from "@mapstore/selectors/map";
import {currentLocaleSelector} from "@mapstore/selectors/locale";
import {generalInfoFormatSelector} from "@mapstore/selectors/mapInfo";

export const configLoadSelector = state => state?.urbanisme?.configLoading;

export const configSelector = state => state?.urbanisme?.config;

export const activeToolSelector = state => state?.urbanisme?.activeTool;

export const printingSelector = state => state?.urbanisme?.printing || false;

export const lpGFIPanelSelector = state => state?.urbanisme?.showGFIPanel || false;

export const attributesSelector = state => state?.urbanisme?.attributes || {};

export const urbanimseControlSelector = state => state?.controls?.urbanisme?.enabled || false;

export const urbanismeLayerSelector = state => {
    const additionalLayers = additionalLayersSelector(state) ?? [];
    return additionalLayers.filter(({id}) => id === URBANISME_RASTER_LAYER_ID)?.[0]?.options;
};

export const urbanismeVectorLayerSelector = state => {
    const additionalLayers = additionalLayersSelector(state) ?? [];
    return additionalLayers.filter(({id}) => id === URBANISME_VECTOR_LAYER_ID)?.[0]?.options;
};

export const clickPointSelector = state => state.urbanisme?.clickPoint;
export const clickLayerSelector = state => state.urbanisme?.clickLayer;
export const itemIdSelector = state => state.urbanisme?.itemId;
export const overrideParamsSelector = state => state.urbanisme?.overrideParams || {};
export const filterNameListSelector = state => state.urbanisme?.filterNameList || [];

/**
 * Defines the general options of the identifyTool to build the request
 */
export const identifyOptionsSelector = createStructuredSelector({
    format: generalInfoFormatSelector,
    map: mapSelector,
    point: clickPointSelector,
    currentLocale: currentLocaleSelector,
    maxItems: (state) => get(state, "mapInfo.configuration.maxItems")
});

/**
 * Gets the current features to plot.
 * @param {object} state the application state
 */
export function urbanismePlotFeaturesSelector(state) {
    const defaultStyle = LAYER_STYLES.selected;
    const features = state.urbanisme?.highlightedFeature || [];
    return features.map((feature) => {
        return {
            ...feature,
            style: defaultStyle
        };
    });
}

