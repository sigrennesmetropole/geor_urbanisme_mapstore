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
import NRUInfo from '../NRUInfo';

describe('NRUInfo', () => {
    beforeEach((done) => {
        document.body.innerHTML = '<div id="container"></div>';
        setTimeout(done);
    });

    afterEach((done) => {
        ReactDOM.unmountComponentAtNode(document.getElementById("container"));
        document.body.innerHTML = '';
        setTimeout(done);
    });

    it('test render NRUInfo component', () => {
        ReactDOM.render(<NRUInfo/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();
    });

    it('test render NRUInfo with parcelle', () => {
        const props = {parcelle: "New parcelle"};
        ReactDOM.render(<NRUInfo {...props}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();

        const parcelleValue = container.querySelector('h3');
        expect(parcelleValue).toBeTruthy();
        expect(parcelleValue.innerText).toEqual(props.parcelle);
    });

    it('test render NRUInfo with parcelle table', () => {
        const props = {commune: "Commune Text", codeSection: "code", numero: "1", adresseCadastrale: "address",
            contenanceDGFiP: "1", surfaceSIG: "1", codeProprio: "code1",
            nomProprio: "1pro", dateRU: "2020/08/02", datePCI: "06/2020", type: ""};
        ReactDOM.render(<NRUInfo {...props}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();

        const parcelleTable = container.querySelector('.table-parcelle');
        expect(parcelleTable).toBeTruthy();

        // Table header
        const parcelleTableHeader = container.querySelectorAll('.table-parcelle > thead > tr > td');
        expect(parcelleTableHeader).toBeTruthy();
        expect(parcelleTableHeader[0].textContent).toContain('urbanisme.nru.territory');
        expect(parcelleTableHeader[1].textContent).toBe(props.commune);

        // Table body - verify that important values are present in the table
        const parcelleColValues = container.querySelectorAll('.table-parcelle > tbody > tr > td.parcelle-table-value');
        expect(parcelleColValues.length).toBeGreaterThan(0);

        // Verify some specific values are in the table
        let foundNumero = false;
        let foundCodeSection = false;
        let foundAddress = false;

        parcelleColValues.forEach(element => {
            if (element.textContent === props.numero) foundNumero = true;
            if (element.textContent === props.codeSection) foundCodeSection = true;
            if (element.textContent === props.adresseCadastrale) foundAddress = true;
        });

        expect(foundNumero).toBe(true);
        expect(foundCodeSection).toBe(true);
        expect(foundAddress).toBe(true);
    });

    it('test render NRUInfo with libelles', () => {
        const libelles = ["libelle_1", "libelle_2"];
        ReactDOM.render(<NRUInfo libelles={libelles}/>, document.getElementById("container"));
        const container = document.getElementById('container');
        expect(container).toBeTruthy();

        const libellesEle = container.querySelectorAll('.libelle');
        expect(libellesEle).toBeTruthy();
        expect(libellesEle.length).toBe(2);
        libelles.forEach((libelle, i) => expect(libellesEle[i].innerText).toEqual(libelle));
    });
});
