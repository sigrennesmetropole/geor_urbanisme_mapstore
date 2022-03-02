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
import { PURGE_MAPINFO_RESULTS, TOGGLE_MAPINFO_STATE, loadFeatureInfo } from '@mapstore/actions/mapInfo';

import {
    setUpPluginEpic,
    toggleLandPlanningEpic,
    cleanUpUrbanismeEpic,
    clickOnMapEventEpic,
    deactivateOnMeasureEnabledEpic,
    getFeatureInfoEpic,
    onClosePanelEpic,
    onToogleToolEpic,
    updateAdditionalLayerEpic, highlightFeatureEpic
} from '../urbanisme';
import {
    setUp,
    LOADING,
    SET_CONFIG,
    TOGGLE_TOOL,
    TOGGLE_VIEWER_PANEL,
    SET_URBANISME_DATA,
    toggleGFIPanel,
    toggleUrbanismeTool,
    URBANISME_FEATURE_INFO_CLICK,
    URBANISME_RESET_FEATURE_HIGHLIGHT, highlightFeature, resetFeatureHighlight, URBANISME_HIGHLIGHT_FEATURE
} from '../../actions/urbanisme';
import {
    DEFAULT_CADASTRAPP_URL,
    DEFAULT_URBANISMEAPP_URL,
    URBANISME_RASTER_LAYER_ID,
    URBANISME_VECTOR_LAYER_ID
} from '../../constants';
import axios from 'axios';
import MockAdapter from "axios-mock-adapter";
import {setAPIURL} from "@js/extension/api";
import {REMOVE_ADDITIONAL_LAYER, UPDATE_ADDITIONAL_LAYER} from "@mapstore/actions/additionallayers";
const CADASTRAPP_URL = DEFAULT_CADASTRAPP_URL;
const URBANISMEAPP_URL = DEFAULT_URBANISMEAPP_URL;

const layersList = [
    {
        id: URBANISME_RASTER_LAYER_ID,
        owner: 'URBANISME',
        actionType: 'overlay',
        options: {
            id: URBANISME_RASTER_LAYER_ID,
            type: 'wms',
            name: 'urbanisme_parcelle',
            url: 'layer_url',
            visibility: true,
            search: {}
        }
    },
    {
        id: URBANISME_VECTOR_LAYER_ID,
        owner: 'URBANISME',
        actionType: 'overlay',
        options: {
            id: URBANISME_VECTOR_LAYER_ID,
            features: [],
            type: 'vector',
            name: 'selectedPlot',
            visibility: true
        }
    }
];

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
                    case UPDATE_ADDITIONAL_LAYER:
                        expect(action.options).toBeTruthy();
                        expect([URBANISME_RASTER_LAYER_ID, URBANISME_VECTOR_LAYER_ID].includes(action.options.id)).toBeTruthy();
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
            additionallayers: layersList,
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
                    case REMOVE_ADDITIONAL_LAYER:
                        expect([URBANISME_RASTER_LAYER_ID, URBANISME_VECTOR_LAYER_ID].includes(action.id)).toBeTruthy();
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
            additionallayers: layersList,
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
                    case URBANISME_FEATURE_INFO_CLICK:
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
            additionallayers: layersList,
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
                    case URBANISME_RESET_FEATURE_HIGHLIGHT:
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
            deactivateOnMeasureEnabledEpic,
            3,
            setControlProperty("measure", "enabled", true),
            actions => {
                expect(actions.length).toBe(3);
                actions.map(action=>{
                    switch (action.type) {
                    case TOGGLE_TOOL:
                        expect(action.activeTool).toBe(null);
                        break;
                    case TOGGLE_VIEWER_PANEL:
                        expect(action.enabled).toBe(false);
                        break;
                    case PURGE_MAPINFO_RESULTS:
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
                    case URBANISME_RESET_FEATURE_HIGHLIGHT:
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            },
            state);
    });

    it('getFeatureInfoEpic load feature info NRU tool OLD', (done) => {
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
        const layerMetaData = {
            features: [{id: "urbanisme_1", geometry: {type: "Polygon", coordinates: [[-1, 1], [-2, 2], [-3, 3], [-4, 4]]}, properties: {id_parc: "350238000BM0027"}}],
            featuresCrs: "EPSG:4326"
        };
        const state = { controls: { measure: { enabled: true}, urbanisme: { enabled: true}},
            urbanisme: { activeTool: "NRU"},
            additionalLayers: [urbanismeLayer]
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

        const urbanismeLayer = layersList[0].options;
        const layerMetaData = {
            features: [{id: "urbanisme_1", type: "Feature", geometry: {type: "Polygon", coordinates: [[-1, 1], [-2, 2], [-3, 3], [-4, 4]]}, properties: {id_parc: "350238000BM0027"}}],
            featuresCrs: "EPSG:4326"
        };
        const state = { controls: { measure: { enabled: true}, urbanisme: { enabled: true}},
            urbanisme: { activeTool: "NRU"},
            additionalLayers: [urbanismeLayer]
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

    it('getFeatureInfoEpic load feature info ADS tool', (done) => {
        mockAxios.onGet(`${URBANISMEAPP_URL}/adsSecteurInstruction`).reply(200, {nom: "nom", ini_instru: "ini"});
        mockAxios.onGet(`${URBANISMEAPP_URL}/adsAutorisation`).reply(200, {numdossier: [{numdossier: "test"}]});
        mockAxios.onGet(`${URBANISMEAPP_URL}/quartier`).reply(200, {numnom: "num", parcelle: "test"});

        const urbanismeLayer = layersList[0].options;
        const layerMetaData = {
            features: [{id: "urbanisme_1", type: "Feature", geometry: {type: "Polygon", coordinates: [[-1, 1], [-2, 2], [-3, 3], [-4, 4]]}, properties: {id_parc: "350238000BM0027"}}],
            featuresCrs: "EPSG:4326"
        };
        const state = {
            controls: { measure: { enabled: true}, urbanisme: { enabled: true}},
            urbanisme: { activeTool: "ADS"},
            additionalLayers: [urbanismeLayer]
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
        const state = {
            controls: { measure: { enabled: true}, urbanisme: { enabled: true}},
            urbanisme: { activeTool: "ADS"}
        };
        testEpic(
            onToogleToolEpic,
            4,
            toggleUrbanismeTool('NRU'),
            actions => {
                expect(actions.length).toBe(4);
                actions.map(action=>{
                    switch (action.type) {
                    case URBANISME_RESET_FEATURE_HIGHLIGHT:
                        break;
                    case SET_URBANISME_DATA:
                        expect(action.property).toEqual(null);
                        break;
                    case TOGGLE_VIEWER_PANEL:
                        expect(action.enabled).toBe(false);
                        break;
                    case TOGGLE_CONTROL:
                        expect(action.control).toBe("measure");
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            }, state);
    });

    it('updateAdditionalLayerEpic on feature highlight test', (done) => {
        const state = {
            controls: { urbanisme: { enabled: true }, measure: {enabled: false}},
            urbanisme: { config: { cadastreWMSURL: "/cadastreWMSURL"}},
            mapInfo: {enabled: false}
        };
        const clickedPoint = {
            pixel: {
                x: 941,
                y: 490
            },
            latlng: {
                lat: 48.11045432031648,
                lng: -1.6808223724365234
            },
            rawPos: [
                -187108.2906135758,
                6125250.209089858
            ],
            modifiers: {
                alt: false,
                ctrl: false,
                metaKey: false,
                shift: false
            }
        };
        const layerMetaData = {
            features: [{id: "urbanisme_1", type: "Feature", geometry: {type: "Polygon", coordinates: [[[-1, 1], [-2, 2], [-3, 3], [-4, 4]]]}, properties: {id_parc: "350238000BM0027"}}],
            featuresCrs: "EPSG:4326"
        };
        testEpic(
            updateAdditionalLayerEpic,
            1,
            highlightFeature(clickedPoint, [layerMetaData?.features[0]], layerMetaData.featuresCrs),
            actions => {
                expect(actions.length).toBe(1);
                actions.map(action=>{
                    switch (action.type) {
                    case UPDATE_ADDITIONAL_LAYER:
                        expect(action.id).toBe(URBANISME_VECTOR_LAYER_ID);
                        expect(action.options.features.length).toBe(2);
                        expect(action.options.features[0].id).toBe('urbanisme_1');
                        expect(action.options.features[1].id).toBe('get-feature-info-point');
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            }, state);
    });

    it('updateAdditionalLayerEpic on feature highlight reset test', (done) => {
        const state = {
            controls: { urbanisme: { enabled: true }, measure: {enabled: false}},
            urbanisme: { config: { cadastreWMSURL: "/cadastreWMSURL"}},
            mapInfo: {enabled: false}
        };
        testEpic(
            updateAdditionalLayerEpic,
            1,
            resetFeatureHighlight(),
            actions => {
                expect(actions.length).toBe(1);
                actions.map(action=>{
                    switch (action.type) {
                    case UPDATE_ADDITIONAL_LAYER:
                        expect(action.id).toBe(URBANISME_VECTOR_LAYER_ID);
                        expect(action.options.features.length).toBe(0);
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            }, state);
    });

    it('highlightFeatureEpic test', (done) => {
        const urbanismeLayer = layersList[0].options;
        const layerMetaData = {
            features: [{id: "urbanisme_1", type: "Feature", geometry: {type: "Polygon", coordinates: [[-1, 1], [-2, 2], [-3, 3], [-4, 4]]}, properties: {id_parc: "350238000BM0027"}}],
            featuresCrs: "EPSG:4326"
        };
        const state = {
            controls: { urbanisme: { enabled: true}},
            urbanisme: {
                config: { cadastreWMSURL: "/cadastreWMSURL"},
                activeTool: "ADS",
                clickPoint: {
                    pixel: {
                        x: 941,
                        y: 490
                    },
                    latlng: {
                        lat: 48.11045432031648,
                        lng: -1.6808223724365234
                    },
                    rawPos: [
                        -187108.2906135758,
                        6125250.209089858
                    ],
                    modifiers: {
                        alt: false,
                        ctrl: false,
                        metaKey: false,
                        shift: false
                    }
                }},
            additionalLayers: [urbanismeLayer]
        };
        testEpic(
            highlightFeatureEpic,
            1,
            loadFeatureInfo(1, "Response", {service: "WMS", id: URBANISME_RASTER_LAYER_ID}, layerMetaData, urbanismeLayer),
            actions => {
                expect(actions.length).toBe(1);
                actions.map(action=>{
                    switch (action.type) {
                    case URBANISME_HIGHLIGHT_FEATURE:
                        expect(action.point).toEqual(state.urbanisme.clickPoint);
                        expect(action.feature).toEqual([layerMetaData.features[0]]);
                        expect(action.featureCrs).toBe(layerMetaData.featuresCrs);
                        break;
                    default:
                        expect(true).toBe(false);
                    }
                });
                done();
            }, state);
    });
});

