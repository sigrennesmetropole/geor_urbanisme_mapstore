/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { includes, isEmpty } from "lodash";
import { saveAs } from "file-saver";
import { get as getProjection } from 'ol/proj';

import axios from "@mapstore/libs/ajax";
import {
    getNearestZoom,
    getMapfishLayersSpecification
} from "@mapstore/utils/PrintUtils";
import { getScales, dpi2dpu } from "@mapstore/utils/MapUtils";
import { reproject, normalizeSRS } from "@mapstore/utils/CoordinatesUtils";
import { layerSelectorWithMarkers, getLayerFromName } from "@mapstore/selectors/layers";
import { clickedPointWithFeaturesSelector } from "@mapstore/selectors/mapInfo";
import { URBANISME_RASTER_LAYER_ID } from "@js/extension/constants";

/**
 * Sets the state of the viewer panel (open/close)
 * @param {object} response data of the print status call
 * @param {string} fileName of the pdf to be downloaded
 * @param {number} retries maximum retries for checking the print status. Retries every 2 sec for 2 minutes
 * @return {promise} pdf download operation
 */
export const retryDownload = (response, fileName, retries = 60) => {
    return axios.get(response.data.statusURL).then(res => {
        const done = (typeof res.data === "object" && res.data?.done) || false;
        if (done) {
            return axios
                .get(response.data.downloadURL, { responseType: "blob" })
                .then(({ data: pdfBlob }) => {
                    return saveAs(pdfBlob, fileName + ".pdf");
                });
        }
        if (retries > 0) {
            return new Promise(resolve => setTimeout(resolve, 2000))
                .then(()=> retryDownload(response, fileName, retries - 1));
        }
        throw new Error(res);
    });
};


export function getScalesForMap({projection, resolutions}, dpi) {
    const dpu = dpi2dpu(dpi, projection);
    return resolutions.map((resolution) => resolution * dpu);
}

/**
 * Parse WMTS layer to support mapfish specification of Georchestra
 * @param {object} layer
 * @param {object} state
 * @return {object} parsed layer
 */
const parseLayer = (layer, state) => {
    let parsedLayer = layer;
    if (layer?.type.toLowerCase() === "wmts") {
        const _layer = getLayerFromName(state, layer.name);
        const srs = normalizeSRS(_layer.srs || 'EPSG:3857', _layer.allowedSRS);
        const projection = getProjection(srs);
        const metersPerUnit = projection.getMetersPerUnit();
        const resolutionToScale = r => r * metersPerUnit / 0.28E-3;
        // eslint-disable-next-line no-unused-vars
        let { "customParams ": customParams = {}, matrixIds = [], ...wmtsLayer } = layer || {};
        wmtsLayer.matrices = matrixIds?.map(({resolution, ...rest}) => ({...rest, scaleDenominator: resolutionToScale(resolution) })) || [];
        parsedLayer = wmtsLayer;
    }
    return parsedLayer;
};

/**
 * Generates the print specification
 * @param {object} state of the application
 * @return {promise} pdf download operation
 */
export const getUrbanismePrintSpec = state => {
    const { print = {}, map = {}, layers } = state || {};
    const spec = print?.spec && { ...print.spec, ...(print.map || {}) };
    const dpi = spec?.resolution || 96;
    const newMap = map.present || {};
    const projection = newMap.projection || {};
    // getScales calls internally getResolutions, that calls a map hook. Map hooks are not available for extensions.
    // so getScales works only on google marcator (the default, if hook is not present).
    const scales = newMap.resolutions ? getScalesForMap(newMap) : getScales();
    const scaleForZoom = scales[getNearestZoom(newMap.zoom, scales, scales)];
    const layersFiltered = layers.flat.filter(
        l =>
            (l.group === "background"
              && l.visibility
              && !l.loadingError
              && (l.type === 'osm' ? ["EPSG:900913", "EPSG:3857"].includes(projection) : true ) // remove osm layer if projection is not compatible
            ) || l.id === URBANISME_RASTER_LAYER_ID
    );
    const { latlng = {} } = clickedPointWithFeaturesSelector(state);
    const projectedCenter = reproject({ x: latlng.lng, y: latlng.lat }, "EPSG:4326", projection);

    // Only first feature of NRU/ADS is used
    const clickedPointFeatures = layerSelectorWithMarkers(state).filter(
        l => l.name === "GetFeatureInfoHighLight"
    );
    const baseLayers = getMapfishLayersSpecification([...layersFiltered], {...spec, projection}, "map");
    const vectorLayers = getMapfishLayersSpecification([...clickedPointFeatures], spec, "map");
    // Update layerSpec to suit Urbanisme print specification
    let layerSpec = ([...baseLayers, ...vectorLayers] || [])
        .map(
            ({ singleTile, extension, format, styles, styleProperty, ...layer }) => ({
                ...parseLayer(layer, state),
                ...(!isEmpty(extension) && { imageExtension: extension }),
                ...(!isEmpty(format) && { imageFormat: format }),
                ...(!isEmpty(styles) && styleProperty && layer.type === "Vector" && {
                    style: {
                        ...styles,
                        styleProperty,
                        Polygon: { ...styles.Polygon, strokeDashstyle: "solid" }
                    },
                    geoJson: {
                        ...layer.geoJson,
                        features: (layer.geoJson.features || []).map(
                            ({ style, ...ft }) => ({ ...ft })
                        )
                    }
                })
            })
        )
        .reverse();
    return { layers: layerSpec, scaleForZoom, projectedCenter, dpi, projection };
};
