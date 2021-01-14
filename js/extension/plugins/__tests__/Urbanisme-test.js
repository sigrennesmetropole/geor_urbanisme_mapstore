/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import expect from 'expect';
import ReactDOM from 'react-dom';

import { createPlugin } from '@mapstore/utils/PluginsUtils';
import { getPluginForTest } from '@mapstore/plugins/__tests__/pluginsTestUtils';

import UrbanismePlugin from '../Extension';

describe('Extension', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });
    it('shows Urbanisme plugin', () => {
        const UrbanismePlugin1 = createPlugin(UrbanismePlugin.name, UrbanismePlugin);
        const { Plugin: ActivePlugin } = getPluginForTest(UrbanismePlugin1, {controls: { urbanisme: { enabled: true }}});
        ReactDOM.render(<ActivePlugin />, document.getElementById("container"));
        expect(document.querySelector('.urbanismeToolbar')).toExist();
    });
    it('hide Urbanisme plugin', ()=> {
        const UrbanismePlugin1 = createPlugin(UrbanismePlugin.name, UrbanismePlugin);
        const { Plugin: DeactivatedPlugin } = getPluginForTest(UrbanismePlugin1, {controls: { urbanisme: { enabled: false }}});
        ReactDOM.render(<DeactivatedPlugin />, document.getElementById("container"));
        expect(document.querySelector('.urbanismeToolbar')).toNotExist();
    });
});
