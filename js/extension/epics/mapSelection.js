import {getLayerJSONFeature} from '@mapstore/observables/wfs';
import {urbanismeLayerSelector} from "@js/extension/selectors/urbanisme";


/**
 * Generate a simple point geometry using position data
 * @param {object} point/position data from the map
 * @return {{coordinates: [number, string], projection: string, type: string}|*} geometry of type Point
 */
export const getPointFeature = point => {
    const geometry = point?.geometricFilter?.value?.geometry;
    if (geometry) {
        return geometry;
    }
    let lng = point.lng || point.latlng.lng;
    let lngCorrected = lng - 360 * Math.floor(lng / 360 + 0.5);
    return {
        coordinates: [lngCorrected, point.lat || point.latlng.lat],
        projection: "EPSG:4326",
        type: "Point"
    };
};

function createRequest(geometry, layer) {
    return getLayerJSONFeature(layer, {
        filterType: "OGC", // CQL doesn't support LineString yet
        featureTypeName: layer?.search?.name ?? layer?.name,
        typeName: layer?.search?.name ?? layer?.name, // the layer name is not used
        ogcVersion: '1.1.0',
        spatialField: {
            attribute: "geom", // TODO: get the geom attribute from config
            geometry,
            operation: "INTERSECTS"
        }
    });
}

export const getUrbanismeFeatures = (geometry, getState) => {
    const layer = urbanismeLayerSelector(getState());
    return createRequest(geometry, layer)
        .map(({features = [], ...rest} = {}) => {
            return {
                ...rest,
                features: features
            };
        });
};
