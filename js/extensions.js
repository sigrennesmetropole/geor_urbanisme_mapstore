/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createPlugin } from "@mapstore/utils/PluginsUtils";
import Extension from './extension/plugins/Extension';
import { name } from '../config';


export default {
    [name]: createPlugin(name, Extension)
};
