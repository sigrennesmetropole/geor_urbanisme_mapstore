/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import expect from 'expect';

import { testEpic } from '@mapstore/epics/__tests__/epicTestUtils';
import { toggleControl } from '@mapstore/actions/controls';
import { UPDATE_ADDITIONAL_LAYER, REMOVE_ADDITIONAL_LAYER } from '@mapstore/actions/additionallayers';

import { setUpPluginEpic, toggleLandPlanningEpic } from '../urbanisme';
import { setUp, LOADING } from '../../actions/urbanisme';
import { URBANISME_RASTER_LAYER_ID } from '../../constants';

describe('Urbanisme EPICS', () => {
    it('setUpPluginEpic', (done) => {
        testEpic(
            setUpPluginEpic,
            1,
            setUp(),
            actions => {
                expect(actions.length).toBe(1);
                expect(actions[0].type).toEqual(LOADING);
                expect(actions[0].value).toEqual(true);
                expect(actions[0].name).toEqual("config");
                done();
            },
            {},
            done
        );
    });

    it('toggleLandPlanningEpic when Urbanisme tool enabled', (done) => {
        const state = {
            controls: {
                urbanisme: {
                    enabled: true
                }
            },
            urbanisme: {
                config: {
                    cadastreWMSURL: "/cadastreWMSURL"
                }
            }
        };
        testEpic(
            toggleLandPlanningEpic,
            1,
            toggleControl('urbanisme', null),
            actions => {
                expect(actions.length).toBe(1);
                expect(actions[0].type).toBe(UPDATE_ADDITIONAL_LAYER);
                done();
            },
            state,
            done
        );
    });

    it('toggleLandPlanningEpic when Urbanisme tool disabled', (done) => {
        const state = {
            additionallayers: [{
                id: URBANISME_RASTER_LAYER_ID,
                options: {
                    id: URBANISME_RASTER_LAYER_ID
                }
            }],
            controls: {
                urbanisme: {
                    enabled: false
                }
            },
            urbanisme: {
                config: {
                    cadastreWMSURL: "/cadastreWMSURL"
                }
            }
        };
        testEpic(
            toggleLandPlanningEpic,
            1,
            toggleControl('urbanisme', null),
            actions => {
                expect(actions.length).toBe(1);
                expect(actions[0].type).toBe(REMOVE_ADDITIONAL_LAYER);
                done();
            },
            state,
            done
        );
    });
});
