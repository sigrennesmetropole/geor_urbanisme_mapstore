/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import expect from 'expect';

import { setUp, SET_UP, setConfiguration, SET_CONFIG } from '../setUp';

describe('Test correctness of the setUp actions', () => {
    it('setUp', () => {
        const action = setUp();
        expect(action).toExist();
        expect(action.type).toBe(SET_UP);
    });

    it('setConfiguration', () => {
        const testConfig = { prop: "A" };
        const action = setConfiguration(testConfig);
        expect(action).toExist();
        expect(action.type).toBe(SET_CONFIG);
        expect(action.config).toEqual(testConfig);
    });
});
