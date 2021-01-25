/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as Rx from "rxjs";
import { get, isEmpty } from "lodash";

import {
    TOGGLE_CONTROL,
    toggleControl,
    SET_CONTROL_PROPERTY
} from "@mapstore/actions/controls";
import { ANNOTATIONS } from "@mapstore/utils/AnnotationsUtils";
import { error } from "@mapstore/actions/notifications";
import { CLICK_ON_MAP } from "@mapstore/actions/map";
import { addLayer, removeLayer } from "@mapstore/actions/layers";
import {
    toggleMapInfoState,
    toggleHighlightFeature,
    purgeMapInfoResults,
    featureInfoClick,
    LOAD_FEATURE_INFO,
    hideMapinfoMarker
} from "@mapstore/actions/mapInfo";
import {
    createControlEnabledSelector,
    measureSelector
} from "@mapstore/selectors/controls";
import { wrapStartStop } from "@mapstore/observables/epics";

import {
    SET_UP,
    setConfiguration,
    loading,
    setAttributes,
    toggleUrbanismeTool,
    toggleGFIPanel,
    TOGGLE_VIEWER_PANEL,
    TOGGLE_TOOL
} from "../actions/urbanisme";
import {
    configSelector,
    configLoadSelector,
    urbanismeLayerSelector,
    urbanimseControlSelector,
    activeToolSelector,
    printingSelector,
    lpGFIPanelSelector
} from "../selectors/urbanisme";
import {
    getConfiguration,
    getCommune,
    getFIC,
    getParcelle,
    getRenseignUrba,
    getRenseignUrbaInfos,
    getQuartier,
    getAdsSecteurInstruction,
    getAdsAutorisation
} from "../api";
import {
    CONTROL_NAME,
    URBANISME_RASTER_LAYER_ID,
    URBANISME_TOOLS,
    DEFAULT_URBANISME_LAYER
} from "../constants";

/**
 * Ensures that config for the urbanisme tool is fetched and loaded
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `SET_UP`
 * @return {observable}
 */
export const setUpPluginEpic = (action$, store) =>
    action$.ofType(SET_UP).switchMap(() => {
        const state = store.getState();
        const isConfigLoaded = configLoadSelector(state);
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
                        return Rx.Observable.of(error({ title: "Error", message: "Unable to setup urbanisme app" }), loading(false, 'configLoading'));

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
        .filter(({ control }) => control === CONTROL_NAME)
        .switchMap(() => {
            const state = store.getState();
            const { cadastreWMSURL: url, layer: name = DEFAULT_URBANISME_LAYER } = configSelector(state) || {};
            const enabled = urbanimseControlSelector(state);
            const mapInfoEnabled = get(state, "mapInfo.enabled");
            const isMeasureEnabled = measureSelector(state);
            if (enabled) {
                return Rx.Observable.from([
                    addLayer({
                        id: URBANISME_RASTER_LAYER_ID,
                        type: "wms",
                        name,
                        url,
                        visibility: true,
                        search: {}
                    }),
                    toggleHighlightFeature(true)
                ]).concat([
                    ...(mapInfoEnabled ? [toggleMapInfoState()] : []),
                    ...(isMeasureEnabled ? [toggleControl("measure")] : [])
                ]);
            }
            const layer = urbanismeLayerSelector(state);
            return !isEmpty(layer)
                ? Rx.Observable.from([
                    removeLayer(URBANISME_RASTER_LAYER_ID),
                    purgeMapInfoResults()
                ]).concat(!mapInfoEnabled ? [toggleMapInfoState()] : [])
                : Rx.Observable.empty();
        });

/**
 * Ensures that when the clicked on map event triggers, it performs get feature info only when urbanimse_parcelle layers is present
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `CLICK_ON_MAP`
 * @return {observable}
 */
export const clickOnMapEventEpic = (action$, { getState }) =>
    action$
        .ofType(CLICK_ON_MAP)
        .filter(() => !isEmpty(urbanismeLayerSelector(getState())))
        .switchMap(({ point, layer }) => {
            const state = getState();
            const isPrinting = printingSelector(state);
            const activeTool = activeToolSelector(state);
            const urbanismeEnabled = urbanimseControlSelector(state);
            const mapInfoEnabled = get(state, "mapInfo.enabled", false);
            if (mapInfoEnabled) {
                return urbanismeEnabled
                    ? Rx.Observable.of(toggleControl(CONTROL_NAME))
                    : Rx.Observable.empty();
            }
            return !isEmpty(activeTool) && !isPrinting
                ? Rx.Observable.concat(
                    Rx.Observable.of(toggleHighlightFeature(true)),
                    Rx.Observable.of(
                        featureInfoClick(point, layer),
                        loading(true, "dataLoading")
                    )
                )
                : Rx.Observable.empty();
        });

/**
 * Ensures that when the urbanisme tool is closed, perform all clean up activity of the plugin
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `TOGGLE_CONTROL`
 * @return {observable}
 */
export const cleanUpUrbanismeEpic = (action$, { getState }) =>
    action$
        .ofType(TOGGLE_CONTROL)
        .filter(({ control }) => {
            const isUrbanismeEnabled = urbanimseControlSelector(getState());
            const isAnnotationsEnabled = createControlEnabledSelector(ANNOTATIONS)(
                getState()
            );
            return (
                (control === CONTROL_NAME && !isUrbanismeEnabled) ||
        (control === ANNOTATIONS && isAnnotationsEnabled && isUrbanismeEnabled)
            );
        })
        .switchMap(({ control }) => {
            const state = getState();
            const activeTool = activeToolSelector(state);
            const gfiPanelEnabled = lpGFIPanelSelector(state);
            let observable$ = Rx.Observable.empty();
            if (control === CONTROL_NAME) {
                observable$ = Rx.Observable.from([
                    ...(!isEmpty(activeTool) ? [toggleUrbanismeTool(null)] : []),
                    ...(gfiPanelEnabled ? [toggleGFIPanel(false)] : []),
                    setAttributes(null),
                    toggleHighlightFeature(false)
                ]);
            } else if (control === ANNOTATIONS) {
                observable$ = Rx.Observable.of(toggleControl(CONTROL_NAME));
            }
            return observable$;
        });

/**
 * Ensures that when the urbanisme plugin is closed when measurement tool is activated
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `SET_CONTROL_PROPERTY`
 * @return {observable}
 */
export const closeOnMeasureEnabledEpic = (action$, { getState }) =>
    action$
        .ofType(SET_CONTROL_PROPERTY)
        .filter(
            ({ control }) => control === "measure" && measureSelector(getState())
        )
        .switchMap(() => {
            const urbanismeEnabled = urbanimseControlSelector(getState());
            return urbanismeEnabled
                ? Rx.Observable.of(toggleControl(CONTROL_NAME))
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
        .filter(({ enabled }) => !enabled)
        .switchMap(() =>
            Rx.Observable.of(hideMapinfoMarker(), toggleHighlightFeature(false))
        );

/**
 * Ensures that upon toggling new tool clean up any activities of previous tool
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `TOGGLE_TOOL`
 * @return {observable}
 */
export const onToogleToolEpic = action$ =>
    action$
        .ofType(TOGGLE_TOOL)
        .switchMap(() =>
            Rx.Observable.from([
                hideMapinfoMarker(),
                toggleHighlightFeature(false),
                setAttributes(null),
                toggleGFIPanel(false)
            ])
        );
/**
 * Ensures that when the feature info is loaded it has parcelle data to proceed further to call NRU/ADS data
 * @memberof epics.urbanisme
 * @param {observable} action$ manages `LOAD_FEATURE_INFO`
 * @return {observable}
 */
export const getFeatureInfoEpic = (action$, { getState }) =>
    action$
        .ofType(LOAD_FEATURE_INFO)
        .filter(
            ({ layer }) =>
                layer.id === URBANISME_RASTER_LAYER_ID &&
        !printingSelector(getState()) &&
        !isEmpty(activeToolSelector(getState()))
        )
        .switchMap(({ layerMetadata }) => {
            const parcelleId = layerMetadata.features?.[0]?.properties?.id_parc || "";
            const activeTool = activeToolSelector(getState());
            if (isEmpty(parcelleId)) {
                return Rx.Observable.of(
                    hideMapinfoMarker(),
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
                    ([commune, parcelle, lisbelle, propPrio, proprioSurf, dates]) =>
                        Rx.Observable.of(
                            setAttributes({
                                ...commune,
                                ...parcelle,
                                ...lisbelle,
                                ...propPrio,
                                ...proprioSurf,
                                ...dates
                            })
                        )
                );
            } else if (activeTool === URBANISME_TOOLS.ADS) {
                observable$ = Rx.Observable.forkJoin(
                    getAdsSecteurInstruction(parcelleId),
                    getAdsAutorisation(parcelleId),
                    getQuartier(parcelleId)
                ).switchMap(([adsSecteurInstruction, adsAutorisation, quartier]) =>
                    Rx.Observable.of(
                        setAttributes({
                            ...adsSecteurInstruction,
                            ...adsAutorisation,
                            ...quartier
                        })
                    )
                );
            }
            return observable$.startWith(toggleGFIPanel(true)).let(
                wrapStartStop(
                    loading(true, "dataLoading"),
                    loading(false, "dataLoading"),
                    e => {
                        console.log(e); // eslint-disable-line no-console
                        return Rx.Observable.of(
                            error({ title: "Error", message: "Unable to fetch data" }),
                            loading(false, "dataLoading")
                        );
                    }
                )
            );
        });

export default {
    toggleLandPlanningEpic,
    setUpPluginEpic,
    clickOnMapEventEpic,
    getFeatureInfoEpic,
    onClosePanelEpic,
    cleanUpUrbanismeEpic,
    closeOnMeasureEnabledEpic,
    onToogleToolEpic
};
