/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import expect from 'expect';

import { toggleNru, TOGGLE_NRU } from '../nru';

describe('Test correctness of the nru actions', () => {
    it('toggleNru', () => {
        const action = toggleNru();
        expect(action).toExist();
        expect(action.type).toBe(TOGGLE_NRU);
    });
});
