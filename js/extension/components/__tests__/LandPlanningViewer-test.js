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
import LandPlanningViewer from '../LandPlanningViewer';
import TestUtils from "react-dom/test-utils";

describe('LandPlanningViewer', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('test render LandPlanningViewer component', () => {
        ReactDOM.render(<LandPlanningViewer/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();
    });

    it('test viewer on close panel', () => {
        const actions = {
            onTogglePanel: () => {}
        };
        const spyOnTogglePanel = expect.spyOn(actions, "onTogglePanel");
        ReactDOM.render(<LandPlanningViewer onTogglePanel={actions.onTogglePanel}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();

        // On toggle button
        const closeButton = container.querySelector('.close');
        TestUtils.Simulate.click(closeButton);
        expect(spyOnTogglePanel).toHaveBeenCalled();

        const cancelButton = container.querySelector('.cancel');
        TestUtils.Simulate.click(cancelButton);
        expect(spyOnTogglePanel).toHaveBeenCalled();
    });

    it('test viewer with NRU attributes', () => {
        ReactDOM.render(<LandPlanningViewer urbanisme={{attributes: {parcelle: "1"}, activeTool: "NRU"}}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();

        const NRUComponent = container.querySelector('.parcelle_nru');
        expect(NRUComponent).toBeTruthy();
    });

    it('test viewer with ADS attributes', () => {
        ReactDOM.render(<LandPlanningViewer urbanisme={{attributes: {parcelle: "1"}, activeTool: "ADS"}}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();

        const NRUComponent = container.querySelector('.parcelle_ads');
        expect(NRUComponent).toBeTruthy();
    });

    it('test viewer with loader', () => {
        ReactDOM.render(<LandPlanningViewer urbanisme={{attributes: {parcelle: "1"}, activeTool: "ADS", dataLoading: true}}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();

        const loader = container.querySelector('.data-loader');
        expect(loader).toBeTruthy();
    });

    it('test viewer print option and spinner', () => {
        ReactDOM.render(<LandPlanningViewer urbanisme={{attributes: {}, activeTool: "ADS", printing: true}}/>, document.getElementById("container"));
        let container = document.getElementById('container');

        // Print button disabled
        let printButton = container.querySelector('.print');
        expect(printButton.classList.contains('disabled')).toBe(true);

        // Spinner when printing
        const spinner = container.querySelector('.spinner');
        expect(spinner).toBeTruthy();
    });

    it('test viewer print option with NRU attributes', () => {
        const actions = {
            onPrint: () => {}
        };
        const spyOnPrint = expect.spyOn(actions, "onPrint");
        ReactDOM.render(<LandPlanningViewer onPrint={actions.onPrint} urbanisme={{attributes: {parcelle: "parcelle_1"}, activeTool: "NRU"}}/>, document.getElementById("container"));
        let container = document.getElementById('container');

        // Print button disabled
        let printButton = container.querySelector('.print');
        expect(printButton.classList.contains('disabled')).toBe(false);

        // On print call
        TestUtils.Simulate.click(printButton);
        expect(spyOnPrint).toHaveBeenCalled();
        expect(spyOnPrint.calls[0].arguments[0]).toEqual({"parcelle": "parcelle_1", "commune": "", "codeSection": "", "numero": "", "adresseCadastrale": "", "contenanceDGFiP": "", "surfaceSIG": "", "codeProprio": "", "nomProprio": "", "adresseProprio": "", "dateRU": "", "datePCI": "", "libelles": [], "outputFilename": "NRU_parcelle_1"});
    });

    it('test viewer print option with ADS attributes', () => {
        const actions = {
            onPrint: () => {}
        };
        const spyOnPrint = expect.spyOn(actions, "onPrint");
        ReactDOM.render(<LandPlanningViewer onPrint={actions.onPrint} urbanisme={{attributes: {id_parcelle: "parcelle_1"}, activeTool: "ADS"}}/>, document.getElementById("container"));
        let container = document.getElementById('container');

        // On print call
        let printButton = container.querySelector('.print');
        TestUtils.Simulate.click(printButton);
        expect(spyOnPrint).toHaveBeenCalled();
        expect(spyOnPrint.calls[0].arguments[0]).toEqual({"layout": "A4 portrait ADS", "instruction": "Aucun secteur d'instruction ne correspond à la localisation de la parcelle", "parcelle": "parcelle_1", "numNom": "Aucun quartier ne correspond à la localisation de la parcelle", "numDossier": "", "outputFilename": "ADS_parcelle_1"});
    });
});
