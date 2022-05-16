/**
 * Copyright 2016, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { checkForMissingPlugins } from '@mapstore/utils/DebugUtils';
import main from '@mapstore/product/main';
import MapViewer from "@mapstore/product/pages/MapViewer";

import ConfigUtils from '@mapstore/utils/ConfigUtils';
/**
 * Add custom (overriding) translations with:
 *
 * ConfigUtils.setConfigProp('translationsPath', ['./MapStore2/web/client/translations', './translations']);
 */
ConfigUtils.setConfigProp('translationsPath', './MapStore2/web/client/translations');
ConfigUtils.setConfigProp('themePrefix', 'MapStoreExtension');

/**
 * Use a custom plugins configuration file with:
 *
 * ConfigUtils.setLocalConfigurationFile('localConfig.json');
 */

/**
 * Use a custom application configuration file with:
 *
 * const appConfig = require('./appConfig');
 *
 * Or override the application configuration file with (e.g. only one page with a mapviewer):
 */
const cfg = require('@mapstore/product/appConfig').default;

const appConfig = {
    ...cfg,
    pages: [
        {
            name: "mapviewer",
            path: "/",
            component: MapViewer
        },
        {
            name: "mapviewer",
            path: "/viewer/:mapType/:mapId",
            component: MapViewer
        }
    ],
    appEpics: {}
};

/**
 * Define a custom list of plugins with:
 *
 * const plugins = require('./plugins');
 */
import plugins from '@mapstore/product/plugins';

// Import plugin directly in application. Comment the 3 lines below to test the extension live.
import extensions from './extensions';
plugins.plugins = { ...plugins.plugins, ...extensions };
ConfigUtils.setConfigProp('translationsPath', ['./MapStore2/web/client/translations', './assets/translations']);
// end of lines to comment
checkForMissingPlugins(plugins.plugins);

main(appConfig, plugins);
