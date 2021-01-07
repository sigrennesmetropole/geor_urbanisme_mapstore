/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import expect from 'expect';

import { configSelector, nruActiveStateSelector, configLoadingState, getUrbanismeLayer } from '../urbanisme';
import { URBANISME_RASTER_LAYER_ID } from '../../constants';

describe('Urbanisme SELECTORS', () => {
    it('should test configSelector', () => {
        const state = {
            urbanisme: {
                config: {prop: "A"}
            }
        };
        expect(configSelector(state)).toEqual({prop: "A"});
    });
    it('should test nruActiveStateSelector', () => {
        const state = {
            urbanisme: {
                config: {prop: "A"},
                nruActive: false
            }
        };
        expect(nruActiveStateSelector(state)).toEqual(false);
    });
    it('should test configLoadingState', () => {
        const state = {
            urbanisme: {
                config: {prop: "A"},
                nruActive: false,
                loadFlags: { config: true }
            }
        };
        expect(configLoadingState(state)).toEqual(true);
    });
    it('should test getUrbanismeLayer', () => {
        const state = {
            additionallayers: [{
                id: URBANISME_RASTER_LAYER_ID,
                options: {
                    id: URBANISME_RASTER_LAYER_ID
                }
            }],
            urbanisme: {
                config: {prop: "A"},
                nruActive: false,
                loadFlags: { config: true }
            }
        };
        expect(getUrbanismeLayer(state)).toEqual({ id: URBANISME_RASTER_LAYER_ID });
    });
});
