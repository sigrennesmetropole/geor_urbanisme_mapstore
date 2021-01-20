/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import expect from "expect";
import {
    toggleUrbanismeTool,
    TOGGLE_TOOL,
    loading,
    LOADING,
    SET_URBANISME_DATA,
    setAttributes,
    toggleGFIPanel,
    TOGGLE_VIEWER_PANEL
} from "../urbanisme";

describe('Test correctness of the urbanisme actions', () => {
    it('toggleUrbanismeTool', () => {
        const action = toggleUrbanismeTool("ADS");
        expect(action).toExist();
        expect(action.type).toBe(TOGGLE_TOOL);
        expect(action.activeTool).toBe("ADS");
    });
    it('loading', () => {
        const action = loading(true, 'data');
        expect(action).toExist();
        expect(action.type).toBe(LOADING);
        expect(action.value).toEqual(true);
        expect(action.name).toEqual('data');
    });
    it('setAttributes', () => {
        const attributes = {name: "URBANISME"};
        const action = setAttributes(attributes);
        expect(action).toExist();
        expect(action.type).toBe(SET_URBANISME_DATA);
        expect(action.property).toEqual(attributes);
    });
    it('toggleGFIPanel', () => {
        const action = toggleGFIPanel(true);
        expect(action).toExist();
        expect(action.type).toBe(TOGGLE_VIEWER_PANEL);
        expect(action.enabled).toEqual(true);
    });
});
