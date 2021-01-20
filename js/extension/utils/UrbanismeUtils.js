/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { includes, isEmpty } from "lodash";
import { saveAs } from "file-saver";

import axios from "@mapstore/libs/ajax";
import {
    getNearestZoom,
    getMapfishLayersSpecification
} from "@mapstore/utils/PrintUtils";
import { getScales } from "@mapstore/utils/MapUtils";
import { reproject } from "@mapstore/utils/CoordinatesUtils";
import { layerSelectorWithMarkers } from "@mapstore/selectors/layers";
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
    const scales = getScales();
    const scaleForZoom = scales[getNearestZoom(newMap.zoom, scales)];
    const layersFiltered = layers.flat.filter(
        l =>
            (l.group === "background" && l.visibility && !l.loadingError) ||
      l.id === URBANISME_RASTER_LAYER_ID
    );
    const { latlng = {} } = clickedPointWithFeaturesSelector(state);
    const projectedCenter = reproject({ x: latlng.lng, y: latlng.lat }, "EPSG:4326", projection);

    // Only first feature of NRU/ADS is used
    const clickedPointFeatures = layerSelectorWithMarkers(state).filter(
        l =>
            l.name === "GetFeatureInfoHighLight" &&
      includes(l.features[0].id, "urbanisme_parcelle")
    );

    // Update layerSpec to suit Urbanisme print specification
    let layerSpec =
    getMapfishLayersSpecification(
        [...layersFiltered, ...clickedPointFeatures],
        spec,
        "map"
    ) || [];
    layerSpec = layerSpec
        .map(
            ({ singleTile, extension, format, styles, styleProperty, ...layer }) => ({
                ...layer,
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
