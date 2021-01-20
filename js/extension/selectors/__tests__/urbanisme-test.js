/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import expect from 'expect';

import { configSelector,
    activeToolSelector,
    printingSelector,
    urbanimseControlSelector,
    attributesSelector,
    lpGFIPanelSelector,
    urbanismeLayerSelector
} from '../urbanisme';
import { URBANISME_RASTER_LAYER_ID, URBANISME_TOOLS } from '../../constants';

describe('Urbanisme selectors', () => {
    it('test configSelector', () => {
        const state = {
            urbanisme: {
                config: {prop: "A"}
            }
        };
        expect(configSelector(state)).toEqual({prop: "A"});
    });
    it('test activeToolSelector', () => {
        const state = {
            urbanisme: {
                activeTool: "NRU"
            }
        };
        expect(activeToolSelector(state)).toEqual(URBANISME_TOOLS.NRU);
    });
    it('test printingSelector', () => {
        const state = {
            urbanisme: {
                config: {prop: "A"},
                printing: true
            }
        };
        expect(printingSelector(state)).toEqual(true);
    });
    it('test urbanimseControlSelector', () => {
        const state = {
            controls: {
                urbanisme: {
                    enabled: true
                }
            }
        };
        expect(urbanimseControlSelector(state)).toEqual(true);
    });
    it('test attributesSelector', () => {
        const state = {
            urbanisme: {
                activeTool: "NRU",
                attributes: {
                    parcelle: "TEST"
                }
            }
        };
        expect(attributesSelector(state)).toEqual({parcelle: "TEST"});
    });
    it('test lpGFIPanelSelector', () => {
        const state = {
            urbanisme: {
                activeTool: "NRU",
                showGFIPanel: true,
                attributes: {
                    parcelle: "TEST"
                }
            }
        };
        expect(lpGFIPanelSelector(state)).toEqual(true);
    });
    it('test urbanismeLayerSelector', () => {
        const state = {
            layers: {
                flat: [{
                    id: URBANISME_RASTER_LAYER_ID,
                    type: "wms",
                    name: "urbanisme_parcelle",
                    url: "/geoserver/wms",
                    visibility: true
                }]
            },
            urbanisme: {
                config: {prop: "A"}
            }
        };
        const layer = urbanismeLayerSelector(state);
        expect(layer).toBeTruthy();
        expect(layer.id).toEqual(URBANISME_RASTER_LAYER_ID);
    });
});
