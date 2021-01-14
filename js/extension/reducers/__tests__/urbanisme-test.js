/**
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import expect from 'expect';

import {setConfiguration, toggleUrbanismeTool, loading, toggleGFIPanel, setAttributes } from '../../actions/urbanisme';
import urbanismeState from '../urbanisme';
import {URBANISME_TOOLS} from "@js/extension/constants";

describe('Urbanisme reducers', () => {
    it('SET_CONFIG', () => {
        const testConfig = { prop: "A"};
        const setConfigAction = setConfiguration(testConfig);
        const state = urbanismeState({}, setConfigAction);
        expect(state.config).toEqual(testConfig);
    });
    it('TOGGLE_TOOL', () => {
        const state = urbanismeState({activeTool: null}, toggleUrbanismeTool("NRU"));
        expect(state.activeTool).toEqual(URBANISME_TOOLS.NRU);
    });
    it('LOADING', () => {
        const loadingAction = loading(true, "config");
        const state = urbanismeState({}, loadingAction);
        expect(state.config).toEqual(true);
    });
    it('TOGGLE_VIEWER_PANEL', () => {
        const state = urbanismeState({}, toggleGFIPanel(true));
        expect(state.showGFIPanel).toEqual(true);
    });
    it('SET_URBANISME_DATA', () => {
        const attributes = {name: "URBANISME"};
        const state = urbanismeState({}, setAttributes(attributes));
        expect(state.attributes).toEqual(attributes);
    });
});
