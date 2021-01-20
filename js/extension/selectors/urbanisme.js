/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { getLayerFromId } from "@mapstore/selectors/layers";

import { URBANISME_RASTER_LAYER_ID } from "../constants";

export const configLoadSelector = state => state?.urbanisme?.configLoading;

export const configSelector = state => state?.urbanisme?.config;

export const activeToolSelector = state => state?.urbanisme?.activeTool;

export const printingSelector = state => state?.urbanisme?.printing || false;

export const lpGFIPanelSelector = state => state?.urbanisme?.showGFIPanel || false;

export const attributesSelector = state => state?.urbanisme?.attributes || {};

export const urbanimseControlSelector = state => state?.controls?.urbanisme?.enabled || false;

export const urbanismeLayerSelector = state => getLayerFromId(state, URBANISME_RASTER_LAYER_ID);
