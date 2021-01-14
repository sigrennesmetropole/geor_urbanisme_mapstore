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
    SET_URBANISME_DATA
} from "../actions/urbanisme";

const initialState = {
    activeTool: null
};

export default function urbanisme(state = initialState, action) {
    switch (action.type) {
    case SET_CONFIG:
        return set("config", action.config, state);
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
    default:
        return state;
    }
}
