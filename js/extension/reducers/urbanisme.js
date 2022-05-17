/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { set } from "@mapstore/utils/ImmutableUtils";

import {
    SET_CONFIG,
    LOADING,
    TOGGLE_VIEWER_PANEL,
    TOGGLE_TOOL,
    SET_URBANISME_DATA, SET_UP,
    URBANISME_FEATURE_INFO_CLICK,
    URBANISME_HIGHLIGHT_FEATURE,
    URBANISME_RESET_FEATURE_HIGHLIGHT
} from "../actions/urbanisme";

const initialState = {
    activeTool: null
};

export default function urbanisme(state = initialState, action) {
    switch (action.type) {
    case SET_UP:
        const { cadastrappUrl, urbanismeappUrl, ...initConfig } = action.initConfig;
        return set('config', initConfig, state);
    case SET_CONFIG:
        return { ...state, config: {...state.config, ...action.config }};
    case TOGGLE_TOOL:
        return set("activeTool", action.activeTool, state);
    case SET_URBANISME_DATA:
        return { ...state, attributes: action.property };
    case LOADING: {
        return set(action.name, action.value, state);
    }
    case TOGGLE_VIEWER_PANEL: {
        return set("showGFIPanel", action.enabled, state);
    }
    case URBANISME_FEATURE_INFO_CLICK: {
        return {...state,
            clickPoint: action.point,
            clickLayer: action.layer,
            itemId: action.itemId,
            overrideParams: action.overrideParams,
            filterNameList: action.filterNameList
        };
    }
    case URBANISME_HIGHLIGHT_FEATURE:
        return {...state,
            highlightedFeature: action.feature,
            featureCrs: action.featureCrs
        };
    case URBANISME_RESET_FEATURE_HIGHLIGHT:
        return {...state,
            highlightedFeature: null,
            featureCrs: null
        };
    default:
        return state;
    }
}
