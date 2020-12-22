/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import { set } from '@mapstore/utils/ImmutableUtils';

import { SET_CONFIG } from '../actions/urbanisme';

export default function urbanisme(state = {}, action) {
    switch (action.type) {
    case SET_CONFIG:
        return set('config', action.config, state);
    default:
        return state;
    }
}
