/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import React from 'react';
import expect from 'expect';
import ReactDOM from "react-dom";
import includes from "lodash/includes";
import UrbanismeToolbar from '../urbanisme/UrbanismeToolbar';
import TestUtils from "react-dom/test-utils";

describe('UrbanismeToolbar', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('test render UrbanismeToolbar component', () => {
        ReactDOM.render(<UrbanismeToolbar enabled/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();
    });

    it('test render UrbanismeToolbar buttons', () => {
        const actions = {
            onToggleTool: () => {}
        };
        const spyOnToggleTool = expect.spyOn(actions, "onToggleTool");
        ReactDOM.render(<UrbanismeToolbar enabled onToggleTool={actions.onToggleTool}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();
        const buttons = container.querySelectorAll("button");
        expect(buttons.length).toBe(4);
        const glyphIcons = ['zoom-to', 'info-sign', 'question-sign', 'remove'];
        buttons.forEach((button, i)=>{
            expect(includes(glyphIcons[i], button.children[0].getAttribute('class')));
        });

        // On toggle button
        const NRUButton = buttons[0];
        TestUtils.Simulate.click(NRUButton);
        expect(spyOnToggleTool).toHaveBeenCalled();
        expect(spyOnToggleTool.calls[0].arguments[0]).toEqual('NRU');
    });

    it('test active tool of UrbanismeToolbar', () => {
        ReactDOM.render(<UrbanismeToolbar enabled urbanisme={{activeTool: "ADS"}}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();
        const buttons = container.querySelectorAll("button");
        expect(buttons.length).toBe(4);
        // Active tool
        const ADSButton = buttons[1];
        expect(includes(ADSButton.getAttribute('class'), 'active')).toBe(true);
    });

    it('test reset tool of UrbanismeToolbar', () => {
        const action = {
            onToggleTool: () => {}
        };
        const spyOnToggleTool = expect.spyOn(action, "onToggleTool");
        ReactDOM.render(<UrbanismeToolbar enabled onToggleTool={action.onToggleTool} urbanisme={{activeTool: "ADS"}}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();
        const buttons = container.querySelectorAll("button");
        expect(buttons.length).toBe(4);
        // Active tool
        const ADSButton = buttons[1];
        TestUtils.Simulate.click(ADSButton);
        expect(spyOnToggleTool).toHaveBeenCalled();
        expect(spyOnToggleTool.calls[0].arguments[0]).toBe(null);
    });

    it('test UrbanismeToolbar close toolbar', () => {
        const actions = {
            onToggleControl: () => {}
        };
        const spyOnToggleControl = expect.spyOn(actions, "onToggleControl");
        ReactDOM.render(<UrbanismeToolbar enabled onToggleControl={actions.onToggleControl}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();
        const buttons = container.querySelectorAll("button");

        // On toggle control
        const closeButton = buttons[3];
        TestUtils.Simulate.click(closeButton);
        expect(spyOnToggleControl).toHaveBeenCalled();
        expect(spyOnToggleControl.calls[0].arguments[0]).toEqual('urbanisme');
    });

    it('test Land planning viewer panel', () => {
        ReactDOM.render(<UrbanismeToolbar enabled urbanisme={{activeTool: "NRU", showGFIPanel: true}} />, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();

        const viewer = container.querySelector("#modal-land-panel-dialog");
        expect(viewer).toBeTruthy();
        expect(viewer.getAttribute('class')).toContain('modal-dialog-draggable');
    });
});
