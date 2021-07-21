/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
import expect from 'expect';

import { testEpic, addTimeoutEpic } from '@mapstore/epics/__tests__/epicTestUtils';
import { toggleControl, TOGGLE_CONTROL, setControlProperty } from '@mapstore/actions/controls';
import { clickOnMap } from '@mapstore/actions/map';
import { PURGE_MAPINFO_RESULTS, TOGGLE_HIGHLIGHT_FEATURE,
    TOGGLE_MAPINFO_STATE, FEATURE_INFO_CLICK, HIDE_MAPINFO_MARKER, loadFeatureInfo } from '@mapstore/actions/mapInfo';
import { ADD_LAYER, REMOVE_LAYER } from '@mapstore/actions/layers';

import { setUpPluginEpic, toggleLandPlanningEpic,
    cleanUpUrbanismeEpic, clickOnMapEventEpic, closeOnMeasureEnabledEpic, getFeatureInfoEpic, onClosePanelEpic, onToogleToolEpic } from '../urbanisme';
import {
    setUp,
    LOADING,
    SET_CONFIG,
    TOGGLE_TOOL,
    TOGGLE_VIEWER_PANEL,
    SET_URBANISME_DATA, toggleGFIPanel, toggleUrbanismeTool
} from '../../actions/urbanisme';
import {DEFAULT_CADASTRAPP_URL, DEFAULT_URBANISMEAPP_URL, URBANISME_RASTER_LAYER_ID} from '../../constants';
import axios from 'axios';
import MockAdapter from "axios-mock-adapter";
import {setAPIURL} from "@js/extension/api";
const CADASTRAPP_URL = DEFAULT_CADASTRAPP_URL;
const URBANISMEAPP_URL = DEFAULT_URBANISMEAPP_URL;
describe('Urbanisme EPICS', () => {
    let mockAxios;
    setAPIURL();
    beforeEach(done => {
        mockAxios = new MockAdapter(axios);
        setTimeout(done);
    });

    afterEach(done => {
        mockAxios.restore();
        setTimeout(done);
    });
    it('setUpPluginEpic', (done) => {
        mockAxios.onGet().reply(200, {});
        testEpic(addTimeoutEpic(setUpPluginEpic, 60), 2, setUp(), actions => {
            expect(actions.length).toBe(2);
            expect(actions[1].type).toBe(SET_CONFIG);
            done();
        }, {});
    });

    it('toggleLandPlanningEpic when Urbanisme tool enabled', (done) => {
        const state = {
            controls: { urbanisme: { enabled: true }, measure: {enabled: true}},
            urbanisme: { config: { cadastreWMSURL: "/cadastreWMSURL"}},
            mapInfo: {enabled: true}
        };
        testEpic(
            toggleLandPlanningEpic,
            4,
            toggleControl('urbanisme', null),
            actions => {
                expect(actions.length).toBe(4);
                actions.map(action=> {
                    switch (action.type) {
                    case ADD_LAYER:
                        expect(action.layer).toBeTruthy();
                        expect(action.layer.id).toBe(URBANISME_RASTER_LAYER_ID);
                        break;
                    case TOGGLE_HIGHLIGHT_FEATURE:
                        expect(action.enabled).toBe(true);
                        break;
                    case TOGGLE_MAPINFO_STATE:
                        break;
                    case TOGGLE_CONTROL:
                        expect(action.control).toBe('measure');
                        break;
                    default:
                        expect(false).toBe(true);
                    }
                });
                done();
            }, state);
    });

    it('toggleLandPlanningEpic when Urbanisme tool disabled', (done) => {
        const state = {
            controls: { urbanisme: { enabled: false }},
            urbanisme: { config: { cadastreWMSURL: "/cadastreWMSURL"}},
            layers: {flat: [{id: URBANISME_RASTER_LAYER_ID, name: "URBANISME_PARCELLE"}]},
            mapInfo: {enabled: false}
        };
        testEpic(
            toggleLandPlanningEpic,
            3,
            toggleControl('urbanisme', null),
            actions => {
                expect(actions.length).toBe(3);
                actions.map(action=>{
                    switch (action.type) {
                    case REMOVE_LAYER:
                        expect(action.layerId).toBe(URBANISME_RASTER_LAYER_ID);
                        break;
                    case PURGE_MAPINFO_RESULTS:
                        break;
                    case TOGGLE_MAPINFO_STATE:
                        break;
                    default:
                        expect(false).toBe(true);
                    }
                });
                done();
            },
            state);
    });

    it('clickOnMapEventEpic with Urbanisme plugin', (done) => {
        const state = {
            controls: { urbanisme: { enabled: true}},
            urbanisme: { activeTool: "NRU" },
            layers: {flat: [{id: URBANISME_RASTER_LAYER_ID, name: "URBANISME_PARCELLE"}]},
            mapInfo: {enabled: false}
        };
        testEpic(
            clickOnMapEventEpic,
            3,
            clickOnMap({latlng: {lat: 48, lng: -1.67}}),
            actions => {
                expect(actions.length).toBe(3);
                actions.map(action=>{
                    switch (action.type) {
                    case TOGGLE_HIGHLIGHT_FEATURE:
                        break;
                    case FEATURE_INFO_CLICK:
                        expect(action.point).toBeTruthy();
                        break;
                    case LOADING:
                        break;
                    case SET_URBANISME_DATA:
                        expect(action.property).toEqual(null); // clear previous data
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            },
            state);
    });

    it('cleanUpUrbanismeEpic when Urbanisme plugin is closed', (done) => {
        const state = {
            controls: { urbanisme: { enabled: false}},
            urbanisme: { activeTool: "NRU", showGFIPanel: true },
            layers: {flat: [{id: URBANISME_RASTER_LAYER_ID, name: "URBANISME_PARCELLE"}]},
            mapInfo: {enabled: false}
        };
        testEpic(
            cleanUpUrbanismeEpic,
            4,
            toggleControl("urbanisme"),
            actions => {
                expect(actions.length).toBe(4);
                actions.map(action=>{
                    switch (action.type) {
                    case TOGGLE_TOOL:
                        expect(action.activeTool).toBe(null);
                        break;
                    case TOGGLE_VIEWER_PANEL:
                        expect(action.enabled).toBe(false);
                        break;
                    case SET_URBANISME_DATA:
                        expect(action.property).toBe(null);
                        break;
                    case TOGGLE_HIGHLIGHT_FEATURE:
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            },
            state);
    });

    it('cleanUpUrbanismeEpic opening annotation when urbanisme plugin is opened', (done) => {
        const state = { controls: { urbanisme: { enabled: true}, annotations: { enabled: true}}};
        testEpic(
            cleanUpUrbanismeEpic,
            1,
            toggleControl("annotations"),
            actions => {
                expect(actions.length).toBe(1);
                actions.map(action=>{
                    switch (action.type) {
                    case TOGGLE_CONTROL:
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            },
            state);
    });

    it('closeOnMeasureEnabledEpic close when urbanisme plugin when measurement is opened', (done) => {
        const state = { controls: { measure: { enabled: true}, urbanisme: { enabled: true}}};
        testEpic(
            closeOnMeasureEnabledEpic,
            1,
            setControlProperty("measure", "enabled", true),
            actions => {
                expect(actions.length).toBe(1);
                actions.map(action=>{
                    switch (action.type) {
                    case TOGGLE_CONTROL:
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            },
            state);
    });

    it('onClosePanelEpic close viewer panel', (done) => {
        const state = { controls: { measure: { enabled: true}, urbanisme: { enabled: true}}};
        testEpic(
            onClosePanelEpic,
            1,
            toggleGFIPanel(false),
            actions => {
                expect(actions.length).toBe(1);
                actions.map(action=>{
                    switch (action.type) {
                    case HIDE_MAPINFO_MARKER:
                        break;
                    case TOGGLE_HIGHLIGHT_FEATURE:
                        expect(action.enabled).toBe(false);
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            },
            state);
    });

    it('getFeatureInfoEpic load feature info', (done) => {
        mockAxios.onGet(`${CADASTRAPP_URL}/getCommune`).reply(200, [{libcom_min: "min"}]);
        mockAxios.onGet(`${CADASTRAPP_URL}/getParcelle`).reply(200, [{parcelle: "parcelle", ccopre: "ccopre",
            ccosec: "ccosec", dnupla: "dnupla", dnvoiri: "dnvoiri", cconvo: "cconvo", dvoilib: "dvoilib", dcntpa: "dcntpa"}]);
        mockAxios.onGet(`${URBANISMEAPP_URL}/renseignUrba`).reply(200, {libelles: [{libelle: "Test"}]});
        mockAxios.onGet(`${CADASTRAPP_URL}/getFIC`, ).reply((config)=>{
            if (config.params.onglet === 0) return [200, [{surfc: "surfc"}]];
            return [200, [{comptecommunal: "codeProprio"}]];
        });
        mockAxios.onGet('/urbanisme/renseignUrbaInfos').reply(200, { date_pci: '2020/10/11', date_ru: '06/2020'});

        const urbanismeLayer = {id: URBANISME_RASTER_LAYER_ID, name: "URBANISME_PARCELLE"};
        const layerMetaData = {features: [{id: "urbanisme_1", geometry: {type: "Polygon", coordinates: [[-1, 1], [-2, 2], [-3, 3], [-4, 4]]}, properties: {id_parc: "350238000BM0027"}}]};
        const state = { controls: { measure: { enabled: true}, urbanisme: { enabled: true}},
            urbanisme: { activeTool: "NRU"},
            layers: {flat: [urbanismeLayer]}
        };
        const attributes = {"commune": "min", "parcelle": "parcelle", "numero": "dnupla", "contenanceDGFiP": "dcntpa", "codeSection": "ccopreccosec", "adresseCadastrale": "dnvoiri cconvo dvoilib", "libelles": ["Test"], "nomProprio": "", "codeProprio": "codeProprio", "adresseProprio": "  ", "surfaceSIG": "surfc", "datePCI": "0/10/11", "dateRU": "06/2020"};
        testEpic(
            addTimeoutEpic(getFeatureInfoEpic, 60),
            3,
            loadFeatureInfo(1, "Response", {service: "WMS", id: URBANISME_RASTER_LAYER_ID}, layerMetaData, urbanismeLayer),
            actions => {
                expect(actions.length).toBe(3);
                actions.map(action=>{
                    switch (action.type) {
                    case LOADING:
                        expect(action.name).toEqual('dataLoading');
                        expect(action.value).toBe(true);
                        break;
                    case TOGGLE_VIEWER_PANEL:
                        expect(action.enabled).toBe(true);
                        break;
                    case SET_URBANISME_DATA:
                        expect(action.property).toEqual(attributes);
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            },
            state);
    });
    it('getFeatureInfoEpic returns even with empty data', (done) => {
        mockAxios.onGet(`${CADASTRAPP_URL}/getCommune`).reply(200, []);
        mockAxios.onGet(`${CADASTRAPP_URL}/getParcelle`).reply(200, []);
        mockAxios.onGet(`${URBANISMEAPP_URL}/renseignUrba`).reply(200, {});
        mockAxios.onGet(`${CADASTRAPP_URL}/getFIC`, ).reply((config)=>{
            if (config.params.onglet === 0) return [200, []];
            return [200, []];
        });
        mockAxios.onGet('/urbanisme/renseignUrbaInfos').reply(200, { date_pci: '2020/10/11', date_ru: '06/2020'});

        const urbanismeLayer = {id: URBANISME_RASTER_LAYER_ID, name: "URBANISME_PARCELLE"};
        const layerMetaData = {features: [{id: "urbanisme_1", geometry: {type: "Polygon", coordinates: [[-1, 1], [-2, 2], [-3, 3], [-4, 4]]}, properties: {id_parc: "350238000BM0027"}}]};
        const state = { controls: { measure: { enabled: true}, urbanisme: { enabled: true}},
            urbanisme: { activeTool: "NRU"},
            layers: {flat: [urbanismeLayer]}
        };
        const attributes = {"datePCI": "0/10/11", "dateRU": "06/2020", libelles: []};
        testEpic(
            addTimeoutEpic(getFeatureInfoEpic, 60),
            3,
            loadFeatureInfo(1, "Response", {service: "WMS", id: URBANISME_RASTER_LAYER_ID}, layerMetaData, urbanismeLayer),
            actions => {
                expect(actions.length).toBe(3);
                actions.map(action=>{
                    switch (action.type) {
                    case LOADING:
                        expect(action.name).toEqual('dataLoading');
                        expect(action.value).toBe(true);
                        break;
                    case TOGGLE_VIEWER_PANEL:
                        expect(action.enabled).toBe(true);
                        break;
                    case SET_URBANISME_DATA:
                        expect(action.property).toEqual(attributes);
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            },
            state);
    });

    it('getFeatureInfoEpic load feature info', (done) => {
        mockAxios.onGet(`${URBANISMEAPP_URL}/adsSecteurInstruction`).reply(200, {nom: "nom", ini_instru: "ini"});
        mockAxios.onGet(`${URBANISMEAPP_URL}/adsAutorisation`).reply(200, {numdossier: [{numdossier: "test"}]});
        mockAxios.onGet(`${URBANISMEAPP_URL}/quartier`).reply(200, {numnom: "num", parcelle: "test"});

        const urbanismeLayer = {id: URBANISME_RASTER_LAYER_ID, name: "URBANISME_PARCELLE"};
        const layerMetaData = {features: [{id: "urbanisme_1", geometry: {type: "Polygon", coordinates: [[-1, 1], [-2, 2], [-3, 3], [-4, 4]]}, properties: {id_parc: "350238000BM0027"}}]};
        const state = { controls: { measure: { enabled: true}, urbanisme: { enabled: true}},
            urbanisme: { activeTool: "ADS"},
            layers: {flat: [urbanismeLayer]}
        };
        const attributes = {"nom": "nom", "ini_instru": "ini", "num_dossier": ["test"], "num_nom": "num", "id_parcelle": "test"};
        testEpic(
            addTimeoutEpic(getFeatureInfoEpic, 60),
            3,
            loadFeatureInfo(1, "Response", {service: "WMS", id: URBANISME_RASTER_LAYER_ID}, layerMetaData, urbanismeLayer),
            actions => {
                expect(actions.length).toBe(3);
                actions.map(action=>{
                    switch (action.type) {
                    case LOADING:
                        expect(action.name).toEqual('dataLoading');
                        expect(action.value).toBe(true);
                        break;
                    case TOGGLE_VIEWER_PANEL:
                        expect(action.enabled).toBe(true);
                        break;
                    case SET_URBANISME_DATA:
                        expect(action.property).toEqual(attributes);
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            },
            state);
    });

    it('onToogleToolEpic clean up activities of previous tool', (done) => {
        testEpic(
            onToogleToolEpic,
            4,
            toggleUrbanismeTool('NRU'),
            actions => {
                expect(actions.length).toBe(4);
                actions.map(action=>{
                    switch (action.type) {
                    case HIDE_MAPINFO_MARKER:
                        break;
                    case TOGGLE_HIGHLIGHT_FEATURE:
                        expect(action.enabled).toBe(false);
                        break;
                    case SET_URBANISME_DATA:
                        expect(action.property).toEqual(null);
                        break;
                    case TOGGLE_VIEWER_PANEL:
                        expect(action.enabled).toBe(false);
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            }, {});
    });

});
