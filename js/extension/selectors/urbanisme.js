/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import { additionalLayersSelector } from '@mapstore/selectors/additionallayers';

import { URBANISME_RASTER_LAYER_ID } from '../constants';

export const configSelector = (state) => state?.urbanisme?.config;

export const nruActiveStateSelector = state => state?.urbanisme.nruActive || false;

export const configLoadingState = state => state?.urbanisme?.loadFlags?.config || false;

export const getUrbanismeLayer = (state) => {
    const additionalLayers = additionalLayersSelector(state) ?? [];
    return additionalLayers.filter(({ id }) => id === URBANISME_RASTER_LAYER_ID)?.[0]?.options;
};
