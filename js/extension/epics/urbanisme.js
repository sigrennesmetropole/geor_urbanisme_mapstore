/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as Rx from "rxjs";
import {get, isEmpty, omit} from "lodash";
import uuid from 'uuid';

import {
    TOGGLE_CONTROL
} from "@mapstore/actions/controls";
import {error} from "@mapstore/actions/notifications";
import {CLICK_ON_MAP, registerEventListener, unRegisterEventListener} from "@mapstore/actions/map";
import {removeAdditionalLayer, updateAdditionalLayer} from '@mapstore/actions/additionallayers';
import {
    closeIdentify,
    errorFeatureInfo,
    exceptionsFeatureInfo,
    getVectorInfo,
    hideMapinfoMarker,
    LOAD_FEATURE_INFO,
    loadFeatureInfo,
    newMapInfoRequest,
    noQueryableLayers,
    purgeMapInfoResults,
    SET_MAP_TRIGGER,
    setMapTrigger,
    TOGGLE_MAPINFO_STATE,
    toggleMapInfoState
} from "@mapstore/actions/mapInfo";

import {localConfigSelector} from '@mapstore/selectors/localConfig';
import proj4 from 'proj4';

import {wrapStartStop} from "@mapstore/observables/epics";

import {
    featureInfoClick,
    highlightFeature,
    loading,
    resetFeatureHighlight,
    SET_UP,
    setAttributes,
    setConfiguration,
    TOGGLE_TOOL,
    TOGGLE_VIEWER_PANEL,
    toggleGFIPanel,
    toggleUrbanismeTool,
    URBANISME_FEATURE_INFO_CLICK,
    URBANISME_HIGHLIGHT_FEATURE,
    URBANISME_RESET_FEATURE_HIGHLIGHT
} from "../actions/urbanisme";
import {
    activeToolSelector,
    clickPointSelector,
    configLoadSelector,
    configSelector,
    identifyOptionsSelector,
    itemIdSelector,
    lpGFIPanelSelector,
    overrideParamsSelector,
    printingSelector,
    urbanimseControlSelector,
    urbanismeLayerSelector
} from "../selectors/urbanisme";
import {
    getAdsAutorisation,
    getAdsSecteurInstruction,
    getCommune,
    getConfiguration,
    getFIC,
    getParcelle,
    getQuartier,
    getRenseignUrba,
    getRenseignUrbaInfos
} from "../api";
import {
    CONTROL_NAME,
    DEFAULT_URBANISME_LAYER,
    URBANISME_OWNER,
    URBANISME_RASTER_LAYER_ID,
    URBANISME_TOOLS,
    URBANISME_VECTOR_LAYER_ID
} from "../constants";
import {localizedLayerStylesEnvSelector} from "@mapstore/selectors/localizedLayerStyles";
import {buildIdentifyRequest, clickedPointToGeoJson, filterRequestParams} from "@mapstore/utils/MapInfoUtils";
import {getFeatureInfo} from "@mapstore/api/identify";
import {
    reprojectGeoJson
} from "@mapstore/utils/CoordinatesUtils";
import {
    highlightStyleSelector,
    mapInfoDisabledSelector,
    mapTriggerSelector,
    showMarkerSelector
} from "@mapstore/selectors/mapInfo";
import {styleFeatures} from "../utils/UrbanismeUtils";
import {resolutionsSelector} from "@mapstore/selectors/map";
import {
    registerHook,
    RESOLUTION_HOOK
} from "@mapstore/utils/MapUtils";
import {shutdownToolOnAnotherToolDrawing} from "@mapstore/utils/ControlUtils";
import {setAPIURL} from "@js/extension/api";
/**
 * Ensures that config for the urbanisme tool is fetched and loaded
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `SET_UP`
 * @return {observable}
 */
export const setUpPluginEpic = (action$, store) =>
    action$.ofType(SET_UP).switchMap((action) => {
        const state = store.getState();
        const isConfigLoaded = configLoadSelector(state);
        setAPIURL(action.initConfig);
        // adds projections from localConfig.json
        // The extension do not see the state proj4 of MapStore (can not reproject in custom CRS as mapstore does)
        // so they have to be registered again in the extension.
        const {projectionDefs = []} = localConfigSelector(state) ?? {};
        projectionDefs.forEach((proj) => {
            proj4.defs(proj.code, proj.def);
        });

        // Re-register hook to get resolutions from the state. Extensions can't access map hooks,
        // so the only way to make it calculate requests bounding box correctly is to force it
        // to use proper resolution from the store
        registerHook(RESOLUTION_HOOK, (currentZoom) => {
            const resolutions = resolutionsSelector(store.getState()) ?? [];
            return resolutions[currentZoom];
        });

        return isConfigLoaded
            ? Rx.Observable.empty()
            : Rx.Observable.defer(() => getConfiguration()).switchMap(({cadastreWMSURL}) =>
                Rx.Observable.of(setConfiguration({cadastreWMSURL}))
            ).let(
                wrapStartStop(
                    loading(true, 'configLoading'),
                    loading(false, 'configLoading'),
                    e => {
                        console.log(e); // eslint-disable-line no-console
                        return Rx.Observable.from([error({
                            title: "Error",
                            message: "Unable to setup urbanisme app"
                        }), loading(false, 'configLoading')]);

                    }
                )
            );
    });

/**
 * Ensures that when the urbanisme tool is enabled in controls, the urbanisme_parcelle layer is added to map
 * as an overlay and when disabled the layer is removed from the map
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `TOGGLE_CONTROL`
 * @return {observable}
 */
export const toggleLandPlanningEpic = (action$, store) =>
    action$
        .ofType(TOGGLE_CONTROL)
        .filter(({control}) => control === CONTROL_NAME)
        .switchMap(() => {
            const state = store.getState();
            const {cadastreWMSURL: url, layer: name = DEFAULT_URBANISME_LAYER} = configSelector(state) || {};
            const enabled = urbanimseControlSelector(state);
            const mapInfoEnabled = get(state, "mapInfo.enabled");
            const mapHoverTrigger = mapTriggerSelector(state);
            if (enabled) {
                return Rx.Observable.from([
                    updateAdditionalLayer(
                        URBANISME_RASTER_LAYER_ID,
                        URBANISME_OWNER,
                        'overlay',
                        {
                            id: URBANISME_RASTER_LAYER_ID,
                            type: "wms",
                            name,
                            url,
                            visibility: true,
                            search: {}
                        }, true),
                    updateAdditionalLayer(
                        URBANISME_VECTOR_LAYER_ID,
                        URBANISME_OWNER,
                        'overlay',
                        {
                            id: URBANISME_VECTOR_LAYER_ID,
                            features: [],
                            type: "vector",
                            name: "selectedPlot",
                            visibility: true
                        })
                ]).concat([
                    ...(mapInfoEnabled ? [toggleMapInfoState()] : []),
                    ...(mapHoverTrigger === 'hover' ? [setMapTrigger("click")] : [])
                ]);
            }
            const layer = urbanismeLayerSelector(state);
            return !isEmpty(layer)
                ? Rx.Observable.from([
                    removeAdditionalLayer({id: URBANISME_RASTER_LAYER_ID, owner: URBANISME_OWNER}),
                    removeAdditionalLayer({id: URBANISME_VECTOR_LAYER_ID, owner: URBANISME_OWNER})
                ]).concat(!mapInfoEnabled ? [toggleMapInfoState()] : [])
                : Rx.Observable.empty();
        });

/**
 * Ensures that when the clicked on map event triggers, it performs get feature info only when urbanimse_parcelle layers is present
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `CLICK_ON_MAP`
 * @return {observable}
 */
export const clickOnMapEventEpic = (action$, {getState}) =>
    action$
        .ofType(CLICK_ON_MAP)
        .filter(() => !isEmpty(urbanismeLayerSelector(getState())))
        .switchMap(({point, layer}) => {
            const state = getState();
            const isPrinting = printingSelector(state);
            const activeTool = activeToolSelector(state);
            const urbanismeEnabled = urbanimseControlSelector(state);
            const mapInfoEnabled = !mapInfoDisabledSelector(state);
            if (mapInfoEnabled) {
                return urbanismeEnabled
                    ? Rx.Observable.of(toggleUrbanismeTool(null))
                    : Rx.Observable.empty();
            }

            return !isEmpty(activeTool) && !isPrinting
                ? Rx.Observable.of(
                    featureInfoClick(point, layer),
                    setAttributes(null),
                    loading(true, "dataLoading")
                )
                : Rx.Observable.empty();
        });

/**
 * Ensures that when the urbanisme tool is closed, perform all clean up activity of the plugin
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `TOGGLE_CONTROL`
 * @return {observable}
 */
export const cleanUpUrbanismeEpic = (action$, {getState}) =>
    action$
        .ofType(TOGGLE_CONTROL)
        .filter(({control}) => {
            const isUrbanismeEnabled = urbanimseControlSelector(getState());
            return control === CONTROL_NAME && !isUrbanismeEnabled;
        })
        .switchMap(({control}) => {
            const state = getState();
            const activeTool = activeToolSelector(state);
            const gfiPanelEnabled = lpGFIPanelSelector(state);
            let observable$ = Rx.Observable.empty();
            if (control === CONTROL_NAME) {
                observable$ = Rx.Observable.from([
                    ...(!isEmpty(activeTool) ? [toggleUrbanismeTool(null)] : []),
                    ...(gfiPanelEnabled ? [toggleGFIPanel(false)] : []),
                    setAttributes(null),
                    resetFeatureHighlight()
                ]);
            }
            return observable$;
        });

/**
 * Toggle urbanisme tool off when one of the drawing tools takes control
 * @param action$
 * @param store
 * @returns {Observable<unknown>}
 */
export const tearDownUrbanismeOnDrawToolActive = (action$, store) => shutdownToolOnAnotherToolDrawing(action$, store, 'urbanisme',
    () => {
        return Rx.Observable.from([
            toggleGFIPanel(false),
            toggleUrbanismeTool(null)
        ]);
    },
    (state) => activeToolSelector(state)
);


/**
 * Ensures that the urbanisme plugin active tool is getting deactivated when Identify tool is activated
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `TOGGLE_MAPINFO_STATE`
 * @return {observable}
 */
export const deactivateOnIdentifyEnabledEpic = (action$, {getState}) =>
    action$
        .ofType(TOGGLE_MAPINFO_STATE)
        .filter(() => !mapInfoDisabledSelector(getState()))
        .switchMap(() => {
            const urbanismeEnabled = urbanimseControlSelector(getState());
            return urbanismeEnabled
                ? Rx.Observable.from([
                    toggleGFIPanel(false),
                    toggleUrbanismeTool(null),
                    closeIdentify()
                ])
                : Rx.Observable.empty();
        });

/**
 * Ensures that the urbanisme plugin is closed when Map info trigger
 * is changed to "hover"
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `SET_MAP_TRIGGER`
 * @return {observable}
 */
export const deactivateOnMapHoverEnabledEpic = (action$, {getState}) =>
    action$
        .ofType(SET_MAP_TRIGGER)
        .filter(() => mapTriggerSelector(getState()) === 'hover')
        .switchMap(() => {
            const urbanismeEnabled = urbanimseControlSelector(getState());
            return urbanismeEnabled
                ? Rx.Observable.from([
                    toggleGFIPanel(false),
                    toggleUrbanismeTool(null),
                    purgeMapInfoResults()
                ])
                : Rx.Observable.empty();
        });

/**
 * Ensures that upon closing viewer panel, highlight of feature is disabled and map marker is hidden
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `TOGGLE_VIEWER_PANEL`
 * @return {observable}
 */
export const onClosePanelEpic = action$ =>
    action$
        .ofType(TOGGLE_VIEWER_PANEL)
        .filter(({enabled}) => !enabled)
        .switchMap(() =>
            Rx.Observable.of(resetFeatureHighlight())
        );

/**
 * Ensures that upon toggling new tool clean up any activities of previous tool
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `TOGGLE_TOOL`
 * @return {observable}
 */
export const onToogleToolEpic = (action$, {getState}) =>
    action$
        .ofType(TOGGLE_TOOL)
        .switchMap(() => {
            const state = getState();
            const activeTool = activeToolSelector(state);
            const mapInfoEnabled = !mapInfoDisabledSelector(state);
            const infoMarkerIsShown = showMarkerSelector(state);
            const mapHoverTrigger = mapTriggerSelector(state);
            return Rx.Observable.from([
                resetFeatureHighlight(),
                setAttributes(null),
                toggleGFIPanel(false),
                ...(activeTool && mapInfoEnabled ? [toggleMapInfoState(), purgeMapInfoResults()] : []),
                ...(activeTool && mapHoverTrigger === 'hover' ? [setMapTrigger("click")] : []),
                ...(infoMarkerIsShown ? [hideMapinfoMarker()] : []),
                ...(activeTool
                    ? [registerEventListener('click', 'urbanisme')]
                    : [unRegisterEventListener('click', 'urbanisme')]
                )
            ]);
        }
        );
/**
 * Ensures that when the feature info is loaded it has parcelle data to proceed further to call NRU/ADS data
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `LOAD_FEATURE_INFO`
 * @return {observable}
 */
export const getFeatureInfoEpic = (action$, {getState}) =>
    action$
        .ofType(LOAD_FEATURE_INFO)
        .filter(
            ({layer}) =>
                layer.id === URBANISME_RASTER_LAYER_ID &&
                !printingSelector(getState()) &&
                !isEmpty(activeToolSelector(getState()))
        )
        .switchMap(({layerMetadata}) => {
            const state = getState();
            const {idParcelleKey} = configSelector(state) ?? {};
            const parcelleId = layerMetadata.features?.[0]?.properties?.[idParcelleKey ?? "id_parc"] || "";
            const activeTool = activeToolSelector(state);
            if (isEmpty(parcelleId)) {
                return Rx.Observable.of(
                    loading(false, "dataLoading"),
                    setAttributes(null)
                );
            }
            let observable$ = Rx.Observable.empty();

            // Call specific services to formulate data of NRU/ADS
            if (activeTool === URBANISME_TOOLS.NRU) {
                const cgoCommune = parcelleId.slice(0, 6);
                const codeCommune = cgoCommune.substr(0, 2) + cgoCommune.substr(3, 6);
                observable$ = Rx.Observable.forkJoin(
                    getCommune(cgoCommune),
                    getParcelle(parcelleId),
                    getRenseignUrba(parcelleId),
                    getFIC(parcelleId, 0),
                    getFIC(parcelleId, 1),
                    getRenseignUrbaInfos(codeCommune)
                ).switchMap(
                    ([commune, parcelle, lisbelle, propPrio, proprioSurf, dates]) => {
                        return Rx.Observable.of(
                            setAttributes({
                                ...commune,
                                ...parcelle,
                                ...lisbelle,
                                ...propPrio,
                                ...proprioSurf,
                                ...dates
                            })
                        );
                    }
                );
            } else if (activeTool === URBANISME_TOOLS.ADS) {
                observable$ = Rx.Observable.forkJoin(
                    getAdsSecteurInstruction(parcelleId),
                    getAdsAutorisation(parcelleId),
                    getQuartier(parcelleId)
                ).switchMap(([adsSecteurInstruction, adsAutorisation, quartier]) => {
                    return Rx.Observable.of(
                        setAttributes({
                            ...adsSecteurInstruction,
                            ...adsAutorisation,
                            ...quartier
                        })
                    );
                }
                );
            }
            return observable$.startWith(
                toggleGFIPanel(true)
            ).let(
                wrapStartStop(
                    loading(true, "dataLoading"),
                    loading(false, "dataLoading"),
                    e => {
                        console.log(e); // eslint-disable-line no-console
                        return Rx.Observable.of(
                            error({title: "Error", message: "Unable to fetch data"}),
                            loading(false, "dataLoading")
                        );
                    }
                )
            );
        });

/**
 * Ensures that loaded feature is highlighted
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `LOAD_FEATURE_INFO`
 * @return {observable}
 */
export const highlightFeatureEpic = (action$, {getState}) =>
    action$
        .ofType(LOAD_FEATURE_INFO)
        .filter(
            ({layer}) =>
                layer.id === URBANISME_RASTER_LAYER_ID &&
                !printingSelector(getState()) &&
                !isEmpty(activeToolSelector(getState()))
        )
        .switchMap(({layerMetadata}) => {
            const {idParcelleKey} = configSelector(getState()) ?? {};
            const clickedPoint = clickPointSelector(getState());
            const parcelleId = layerMetadata.features?.[0]?.properties?.[idParcelleKey ?? "id_parc"] || "";
            if (isEmpty(parcelleId)) {
                return Rx.Observable.of(
                    resetFeatureHighlight()
                );
            }
            return Rx.Observable.of(
                highlightFeature(clickedPoint, [layerMetadata?.features[0]], layerMetadata.featuresCrs)
            );
        });

/**
 * Triggers data load on FEATURE_INFO_CLICK events
 */
export const getUrbanismeFeatureInfoOnFeatureInfoClick = (action$, {
    getState = () => {
    }
}) =>
    action$.ofType(URBANISME_FEATURE_INFO_CLICK)
        .switchMap(({point, filterNameList = [], overrideParams = {}}) => {
            // Reverse - To query layer in same order as in TOC
            let queryableLayers = [urbanismeLayerSelector(getState())].filter(e => e);
            if (queryableLayers.length === 0) {
                return Rx.Observable.of(purgeMapInfoResults(), noQueryableLayers());
            }

            // TODO: make it in the application getState()
            const excludeParams = ["SLD_BODY"];
            const includeOptions = [
                "buffer",
                "cql_filter",
                "filter",
                "propertyName"
            ];
            const out$ = Rx.Observable.from((queryableLayers.filter(l => {
                // filtering a subset of layers
                return filterNameList.length ? (filterNameList.filter(name => name.indexOf(l.name) !== -1).length > 0) : true;
            })))
                .mergeMap(layer => {
                    let env = localizedLayerStylesEnvSelector(getState());
                    let {
                        url,
                        request,
                        metadata
                    } = buildIdentifyRequest(layer, {...identifyOptionsSelector(getState()), env, point});
                    // request override
                    if (itemIdSelector(getState()) && overrideParamsSelector(getState())) {
                        request = {...request, ...overrideParamsSelector(getState())[layer.name]};
                    }
                    if (overrideParams[layer.name]) {
                        request = {...request, ...overrideParams[layer.name]};
                    }
                    if (url) {
                        const basePath = url;
                        const requestParams = request;
                        const lMetaData = metadata;
                        const appParams = filterRequestParams(layer, includeOptions, excludeParams);
                        const itemId = itemIdSelector(getState());
                        const reqId = uuid.v1();
                        const param = {...appParams, ...requestParams};
                        return getFeatureInfo(basePath, param, layer, {attachJSON: true, itemId})
                            .map((response) =>
                                response.data.exceptions
                                    ? exceptionsFeatureInfo(reqId, response.data.exceptions, requestParams, lMetaData)
                                    : loadFeatureInfo(reqId, response.data, requestParams, {
                                        ...lMetaData,
                                        features: response.features,
                                        featuresCrs: response.featuresCrs
                                    }, layer)
                            )
                            .catch((e) => Rx.Observable.of(errorFeatureInfo(reqId, e.data || e.statusText || e.status, requestParams, lMetaData)))
                            .startWith(newMapInfoRequest(reqId, param));
                    }
                    return Rx.Observable.of(getVectorInfo(layer, request, metadata, queryableLayers));
                });
            // NOTE: multiSelection is inside the event
            // TODO: move this flag in the application state
            if (point && point.modifiers && point.modifiers.ctrl === true && point.multiSelection) {
                return out$;
            }
            return out$.startWith(purgeMapInfoResults());
        });

/**
 * Updates additional layer with vector data to show highlighted feature and click marker
 */
export const updateAdditionalLayerEpic = (action$, {
    getState = () => {
    }
}) =>
    action$.ofType(URBANISME_HIGHLIGHT_FEATURE, URBANISME_RESET_FEATURE_HIGHLIGHT)
        .switchMap(({ point = {}, feature, featureCrs, type }) => {
            const state = getState();
            const enabled = urbanimseControlSelector(state);
            if (enabled && type === URBANISME_HIGHLIGHT_FEATURE) {
                const styledFeatures = styleFeatures(feature, omit(highlightStyleSelector(state), ["radius"]));
                const features = styledFeatures && featureCrs ? styledFeatures.map( f => reprojectGeoJson(
                    f,
                    featureCrs
                )) : styledFeatures;
                const markerFeature = clickedPointToGeoJson(point.latlng);
                return Rx.Observable.of(
                    updateAdditionalLayer(
                        URBANISME_VECTOR_LAYER_ID,
                        URBANISME_OWNER,
                        'overlay',
                        {
                            id: URBANISME_VECTOR_LAYER_ID,
                            features: features.concat(markerFeature),
                            type: "vector",
                            name: "selectedPlot",
                            visibility: true
                        })
                );
            } else if (enabled && type === URBANISME_RESET_FEATURE_HIGHLIGHT) {
                return Rx.Observable.of(
                    updateAdditionalLayer(
                        URBANISME_VECTOR_LAYER_ID,
                        URBANISME_OWNER,
                        'overlay',
                        {
                            id: URBANISME_VECTOR_LAYER_ID,
                            features: [],
                            type: "vector",
                            name: "selectedPlot",
                            visibility: true
                        })
                );
            }
            return Rx.Observable.empty();
        });

export default {
    toggleLandPlanningEpic,
    setUpPluginEpic,
    clickOnMapEventEpic,
    getFeatureInfoEpic,
    onClosePanelEpic,
    cleanUpUrbanismeEpic,
    onToogleToolEpic,
    getUrbanismeFeatureInfoOnFeatureInfoClick,
    highlightFeatureEpic,
    updateAdditionalLayerEpic,
    deactivateOnMapHoverEnabledEpic,
    deactivateOnIdentifyEnabledEpic,
    tearDownUrbanismeOnDrawToolActive
};
