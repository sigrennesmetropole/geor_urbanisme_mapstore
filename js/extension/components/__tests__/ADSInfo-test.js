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
import ADSInfo from '../ADSInfo';

describe('ADSInfo', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('test render ADSInfo component', () => {
        ReactDOM.render(<ADSInfo/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();
    });

    it('test render ADSInfo with empty secteur and empty quartier', () => {
        const props = {id_parcelle: "parcelle_1"};
        ReactDOM.render(<ADSInfo {...props}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();

        const span = container.querySelectorAll('span');
        const secteur = span[2];
        const quartier = span[5];
        expect(secteur.innerText).toEqual('urbanisme.ads.emptyNom');
        expect(quartier.innerText).toEqual('urbanisme.ads.emptyNumNom');
    });

    it('test render ADSInfo with valid secteur and valid quartier', () => {
        const props = {nom: 'A', ini_instru: "B", num_nom: "Valid"};
        ReactDOM.render(<ADSInfo {...props}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();

        const span = container.querySelectorAll('span');
        const secteur = span[2];
        const quartier = span[5];
        expect(secteur.innerText).toEqual(props.nom + ' / ' + props.ini_instru);
        expect(quartier.innerText).toEqual(props.num_nom);
    });

    it('test render ADSInfo list of ADS', () => {
        const props = {num_dossier: ["num1", "num2"]};
        ReactDOM.render(<ADSInfo {...props}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();

        const listOfADS = container.querySelectorAll('li');
        expect(listOfADS.length).toBe(2);
        listOfADS.forEach((li, i) => {
            expect(li.innerText).toBe(props.num_dossier[i]);
        });
    });

    it('test render ADSInfo parcelle', () => {
        const props = {id_parcelle: "New parcelle"};
        ReactDOM.render(<ADSInfo {...props}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();

        const parcelleTitle = container.querySelector('h2');
        const parcelleValue = container.querySelectorAll('h3')[0];
        expect(parcelleTitle).toBeTruthy();
        expect(parcelleTitle.innerText).toEqual('urbanisme.ads.parcelle');
        expect(parcelleValue.innerText).toEqual(props.id_parcelle);
    });
});
