/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from "@mapstore/libs/ajax";
import { isEmpty } from "lodash";
import proj4 from "proj4";
import {DEFAULT_CADASTRAPP_URL, DEFAULT_URBANISMEAPP_URL, DEFAULT_REVERSE_GEOCODING_URL, DEFAULT_REVERSE_GEOCODING_FROM_CRS, DEFAULT_REVERSE_GEOCODING_TO_CRS} from "@js/extension/constants";

let cadastrappURL;
let urbanismeURL;
let renseignUrbaGroupe;
let reverseGeocodingURL;
let reverseGeocodingFromCrs;
let reverseGeocodingToCrs;
let reverseGeocodingParams;

export const setAPIURL = (config) => {
    cadastrappURL = config?.cadastrappUrl || DEFAULT_CADASTRAPP_URL;
    urbanismeURL = config?.urbanismeappUrl || DEFAULT_URBANISMEAPP_URL;
    renseignUrbaGroupe = !!config?.urbanismeRenseignGroupe;
    reverseGeocodingURL = config?.reverseGeocodingUrl || DEFAULT_REVERSE_GEOCODING_URL;
    reverseGeocodingFromCrs = config?.reverseGeocodingFromCrs || DEFAULT_REVERSE_GEOCODING_FROM_CRS;
    reverseGeocodingToCrs = config?.reverseGeocodingToCrs || DEFAULT_REVERSE_GEOCODING_TO_CRS;
    reverseGeocodingParams = config?.reverseGeocodingParams || {};
};

/* eslint-disable camelcase */

/**
 * Retrieves the initial configuration for cadastrapp services
 * @returns {object} the configuration of the services containing base details of WMS/WFS services
 */
export function getConfiguration() {
    return axios.get(`${cadastrappURL}/getConfiguration`).then(({ data }) => data);
}

export const getCommune = cgocommune => {
    return axios
        .get(`${cadastrappURL}/getCommune`, { params: { cgocommune } })
        .then(({ data }) => {
            if (isEmpty(data)) {
                return null;
            }
            const [{ libcom_min: commune }] = data;
            return { commune };
        });
};

export const getParcelle = code => {
    return axios
        .get(`${cadastrappURL}/getParcelle`, { params: { parcelle: code } })
        .then(({ data }) => {
            if (!isEmpty(data)) {
                const [
                    {
                        parcelle,
                        ccopre,
                        ccosec,
                        dnupla: numero,
                        dnvoiri,
                        dindic,
                        cconvo,
                        dvoilib,
                        dcntpa: contenanceDGFiP
                    }
                ] = data;
                let parcelleObj = { parcelle, numero, contenanceDGFiP };
                if (ccopre !== "000") {
                    parcelleObj.codeSection = ccopre + ccosec;
                } else {
                    parcelleObj.codeSection = ccosec;
                }
                if (dnvoiri || cconvo || dvoilib || dindic) {
                    parcelleObj.adresseCadastrale =
                    `${dnvoiri}` + "" + `${dindic ?? ""}` + " "  + cconvo + " " + dvoilib;
                } else {
                    parcelleObj.adresseCadastrale = "";
                }
                return parcelleObj;
            }
            return null;
        });
};

export const getRenseignUrbaNonGroupe = parcelle => {
    return axios
        .get(`${urbanismeURL}/renseignUrba`, { params: { parcelle } })
        .then(({ data }) => {
            return { libelles: (data?.libelles || []).map(({ libelle }) => libelle) };
        });
};

export const getPrintTemplate = typesDocument => {
    const typeParams = typesDocument.map(v => `type=${v}`).join('&');
    return axios
        .get(`${urbanismeURL}/templates?${typeParams}`)
        .then(( template ) => {
            return template?.data;
        });
};


export const getRenseignUrbaGroupe = parcelle => {
    return axios
        .get(`${urbanismeURL}/renseignUrbaGroupe`, { params: { parcelle } })
        .then(({ data }) => {
            return { groupesLibelle: (data?.groupesLibelle || []), adressesPostales: (data?.adressesPostales || []) };
        });
};

export const getRenseignUrba = parcelle => {
    if (renseignUrbaGroupe) {
        return getRenseignUrbaGroupe(parcelle);
    }
    return getRenseignUrbaNonGroupe(parcelle);

};

export const getFIC = (parcelle, onglet) => {
    return axios
        .get(`${cadastrappURL}/getFIC`, { params: { parcelle, onglet } })
        .then(({ data }) => {
            if (isEmpty(data)) {
                return null;
            }
            const [record] = data;
            if (onglet === 1) {
                let appNomUsage = data.map(({ app_nom_usage }) => app_nom_usage);
                let parcelleObj = {
                    nomProprio: appNomUsage.join(", ")
                };
                const {
                    comptecommunal: codeProprio,
                    dlign4 = "",
                    dlign5 = "",
                    dlign6 = ""
                } = record || {};
                const adresseProprio =
          (dlign4 ? dlign4.trim() : "") + " " + (dlign5 ? dlign5.trim() : "") + " " + (dlign6 ? dlign6.trim() : "");
                return { ...parcelleObj, codeProprio, adresseProprio };
            }
            return { surfaceSIG: record?.surfc || "" };
        });
};

export const getRenseignUrbaInfos = code => {
    return axios
        .get(`${urbanismeURL}/renseignUrbaInfos`, { params: { code_commune: code } })
        .then(({ data }) => {
            if (isEmpty(data)) {
                return null;
            }
            return { datePCI: data.date_pci.slice(3, 10), dateRU: data.date_ru };
        });
};

export const getAdsSecteurInstruction = parcelle => {
    return axios
        .get(`${urbanismeURL}/adsSecteurInstruction`, { params: { parcelle } })
        .then(({ data }) => {
            if (isEmpty(data)) {
                return null;
            }
            return { nom: data.nom, ini_instru: data.ini_instru };
        });
};

export const getAdsAutorisation = parcelle => {
    return axios
        .get(`${urbanismeURL}/adsAutorisation`, { params: { parcelle } })
        .then(({ data }) => {
            if (isEmpty(data)) {
                return null;
            }
            const { numdossier = [] } = data;
            const ads = "Aucun ADS trouvé pour la parcelle";
            if (isEmpty(numdossier)) {
                return { num_dossier: [ads] };
            }
            return {
                num_dossier: numdossier.map(({ numdossier: numData }) => numData)
            };
        });
};

export const getQuartier = parcelle => {
    return axios
        .get(`${urbanismeURL}/quartier`, { params: { parcelle } })
        .then(({ data }) => {
            if (isEmpty(data)) {
                return null;
            }
            return { num_nom: data.numnom, id_parcelle: data.parcelle };
        });
};

export const getReverseGeocoding = geometry => {
    if (!geometry) {
        return Promise.resolve(null);
    }
    const reprojectCoords = coords => coords.map(([x, y]) => proj4(reverseGeocodingFromCrs || DEFAULT_REVERSE_GEOCODING_FROM_CRS, reverseGeocodingToCrs || DEFAULT_REVERSE_GEOCODING_TO_CRS, [x, y]));
    
    const normalizeGeometry = geom => {
        if (!geom || geom.type !== "Polygon" || !Array.isArray(geom.coordinates)) {
            return geom;
        }
        if (!reverseGeocodingFromCrs || !reverseGeocodingToCrs || reverseGeocodingFromCrs === reverseGeocodingToCrs ) {
            return geom;
        }
        return {
            ...geom,
            coordinates: geom.coordinates.map(ring => reprojectCoords(ring))
        };
    };
    const request = geom => {
        const normalizedGeom = normalizeGeometry(geom);
        const defaultParams = {
            index: "address",
            limit: 10,
            returntruegeometry: false
        };
        const requestParams = {
            ...defaultParams,
            ...(reverseGeocodingParams || {}),
            searchgeom: JSON.stringify(normalizedGeom)
        };
        return axios
            .get(reverseGeocodingURL || DEFAULT_REVERSE_GEOCODING_URL, {
                params: requestParams
            })
            .then(({ data }) => data);
    }

    if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
        const polygons = geometry.coordinates.map(coords => ({
            type: "Polygon",
            coordinates: coords
        }));
        return Promise.all(polygons.map(request));
    }

    return request(geometry);
};

export const printPDF = (params) => {
    return axios.post(`${urbanismeURL}/print/report.pdf`, params);
};
