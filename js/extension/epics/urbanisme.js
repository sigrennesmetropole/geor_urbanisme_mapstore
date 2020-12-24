/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import * as Rx from 'rxjs';

import { TOGGLE_CONTROL } from '@mapstore/actions/controls';
import { error } from '@mapstore/actions/notifications';
import { updateAdditionalLayer, removeAdditionalLayer } from '@mapstore/actions/additionallayers';
import { wrapStartStop } from '@mapstore/observables/epics';

import { SET_UP, setConfiguration, loading } from '../actions/urbanisme';
import { configSelector, getUrbanismeLayer } from '../selectors/urbanisme';
import { getConfiguration } from '../api';
import { URBANISME_RASTER_LAYER_ID, URBANISME_OWNER, URBANISME_LAYER_NAME } from '../constants';

/**
 * Ensures that config for the urbanisme tool is fetched and loaded
 * @memberof epics.urbanisme
 * @param {external:Observable} action$ manages `SET_UP`
 * @return {external:Observable}
 */
export const setUpPluginEpic = (action$, store) =>
    action$.ofType(SET_UP)
        .switchMap(() => {
            const state = store.getState();
            const isConfigLoaded = !!configSelector(state);

            return isConfigLoaded
                ? Rx.Observable.empty()
                : Rx.Observable.defer(() => getConfiguration())
                    .switchMap(data => {
                        return Rx.Observable.of(setConfiguration(data));
                    }).let(
                        wrapStartStop(
                            loading(true, 'config'),
                            loading(false, 'config'),
                            e => {
                                console.log(e); // eslint-disable-line no-console
                                return Rx.Observable.of(error({ title: "Error", message: "Unable to setup urbanisme config" }), loading(false, 'config'));
                            }
                        )
                    );
        });

/**
 * Ensures that when the urbanisme tool is enabled in controls, the urbanisme_parcelle layer is added to map
 * as an overlay and when disabled the layer is removed from the map
 * @memberof epics.urbanisme
 * @param {external:Observable} action$ manages `TOGGLE_CONTROL`
 * @return {external:Observable}
 */
export const toggleLandPlanningEpic =  (action$, store) =>
    action$.ofType(TOGGLE_CONTROL)
        .filter(({ control }) => control === "urbanisme")
        .switchMap(() => {
            const state = store.getState();
            const { cadastreWMSURL } = configSelector(state);
            const enabled = state.controls && state.controls.urbanisme && state.controls.urbanisme.enabled || false;
            if (enabled) {
                return Rx.Observable.of(updateAdditionalLayer(
                    URBANISME_RASTER_LAYER_ID,
                    URBANISME_OWNER,
                    'overlay',
                    {
                        id: URBANISME_RASTER_LAYER_ID,
                        type: "wms",
                        name: URBANISME_LAYER_NAME,
                        url: cadastreWMSURL,
                        visibility: true,
                        search: {}
                    },
                    true
                ));
            }

            const layer = getUrbanismeLayer(state);
            return layer
                ? Rx.Observable.of(removeAdditionalLayer({ id: URBANISME_RASTER_LAYER_ID, owner: URBANISME_OWNER }))
                : Rx.Observable.empty();
        });

export default {
    toggleLandPlanningEpic,
    setUpPluginEpic
};
