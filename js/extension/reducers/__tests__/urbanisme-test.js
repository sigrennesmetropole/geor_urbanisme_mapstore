/**
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import expect from 'expect';

import { setConfiguration, toggleNru, loading } from '../../actions/urbanisme';
import urbanismeState from '../urbanisme';

describe('Urbanisme REDUCERS', () => {
    it('SET_CONFIG', () => {
        const testConfig = { prop: "A"};
        const setConfigAction = setConfiguration(testConfig);
        const state = urbanismeState({}, setConfigAction);
        expect(state.config).toEqual(testConfig);
    });
    it('TOGGLE_NRU', () => {
        const toggleNruAction = toggleNru();
        const state = urbanismeState({nruActive: true}, toggleNruAction);
        expect(state.nruActive).toEqual(false);
    });
    it('LOADING', () => {
        const loadingAction = loading(true, "config");
        const state = urbanismeState({}, loadingAction);
        expect(state.loadFlags).toEqual({ config: true });
        expect(state.loading).toEqual(true);
    });
});
