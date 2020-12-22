/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import * as Rx from 'rxjs';

import { TOGGLE_CONTROL } from '@mapstore/actions/controls';
import { updateAdditionalLayer, removeAdditionalLayer } from '@mapstore/actions/additionallayers';


export const URBANISME_RASTER_LAYER_ID = "__URBANISME_VECTOR_LAYER__";
export const URBANISME_OWNER = "URBANISME";
export const CONTROL_NAME = 'urbanisme';

export default () => ({
    toggleLandPlanningEpic: (action$, store) =>
        action$.ofType(TOGGLE_CONTROL)
            .filter(({ control }) => control === "urbanisme")
            .switchMap(() => {
                const state = store.getState();
                const enabled = state.controls && state.controls.urbanisme && state.controls.urbanisme.enabled || false;
                if (enabled) {
                    return Rx.Observable.of(updateAdditionalLayer(
                        URBANISME_RASTER_LAYER_ID,
                        URBANISME_OWNER,
                        'overlay',
                        {
                            id: URBANISME_RASTER_LAYER_ID,
                            type: "wms",
                            name: "urbanisme_parcelle",
                            url: "https://georchestra.geo-solutions.it:443/geoserver/qgis/ows?SERVICE=WMS&REQUEST=GetCapabilities",
                            visibility: true,
                            search: {}
                        },
                        true
                    ));
                }
                return Rx.Observable.of(removeAdditionalLayer({ id: URBANISME_RASTER_LAYER_ID, owner: URBANISME_OWNER }),);
            })
});
