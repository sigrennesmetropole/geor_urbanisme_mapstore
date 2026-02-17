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

    /**
     * Calcule la boîte englobante d'un polygon à partir de ses coordonnées
     */
    const getBoundingBox = coords => {
        // coords est de la forme [[[x, y], [x, y], ...], [...]] (rings)
        const xs = [];
        const ys = [];
        for (const ring of coords) {
            for (const [x, y] of ring) {
                xs.push(x);
                ys.push(y);
            }
        }
        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys)
        };
    };

    /**
     * Calcule la longueur de la diagonale de la boîte englobante (en mètres)
     */
    const getDiagonal = bbox => {
        const dx = bbox.maxX - bbox.minX;
        const dy = bbox.maxY - bbox.minY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    /**
     * Vérifie si un point est à l'intérieur d'un polygon (algorithme Ray Casting)
     * @param {Array} point - [x, y]
     * @param {Array} polygon - coordonnées du polygon [[[x, y], ...]]
     * @returns {boolean}
     */
    const pointInPolygon = (point, polygon) => {
        const [x, y] = point;
        const ring = polygon[0]; // Exterior ring
        let inside = false;

        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }

        return inside;
    };

    /**
     * Vérifie si une cellule rectangulaire intersecte le polygon
     * en testant si au moins un point (centre ou coins) est dans le polygon
     * ou si le polygon traverse la cellule
     */
    const cellIntersectsPolygon = (cellMinX, cellMaxX, cellMinY, cellMaxY, polygonCoords) => {
        // Tester le centre de la cellule
        const centerX = (cellMinX + cellMaxX) / 2;
        const centerY = (cellMinY + cellMaxY) / 2;

        if (pointInPolygon([centerX, centerY], polygonCoords)) {
            return true;
        }

        // Tester les 4 coins de la cellule
        const corners = [
            [cellMinX, cellMinY],
            [cellMaxX, cellMinY],
            [cellMaxX, cellMaxY],
            [cellMinX, cellMaxY]
        ];

        for (const corner of corners) {
            if (pointInPolygon(corner, polygonCoords)) {
                return true;
            }
        }

        // Vérifier si des points du polygon sont dans la cellule
        const ring = polygonCoords[0];
        for (const [x, y] of ring) {
            if (x >= cellMinX && x <= cellMaxX && y >= cellMinY && y <= cellMaxY) {
                return true;
            }
        }

        return false;
    };

    /**
     * Découpe un polygon en sous-polygons si sa diagonale dépasse la limite
     * @param {Object} polygon - Le polygon à découper
     * @param {number} maxDiagonal - La diagonale maximale en mètres (par défaut 1000m)
     * @returns {Array} - Liste de polygons dont la diagonale est inférieure à maxDiagonal
     */
    const subdividePolygon = (polygon, maxDiagonal = 1000) => {
        if (!polygon || polygon.type !== "Polygon" || !Array.isArray(polygon.coordinates)) {
            return [polygon];
        }

        const bbox = getBoundingBox(polygon.coordinates);
        const diagonal = getDiagonal(bbox);

        // Si la diagonale est acceptable, retourner le polygon tel quel
        if (diagonal <= maxDiagonal) {
            return [polygon];
        }

        // Calculer le nombre de subdivisions nécessaires
        const subdivisions = Math.ceil(diagonal / maxDiagonal);

        // Calculer les dimensions de chaque cellule de la grille
        const cellWidth = (bbox.maxX - bbox.minX) / subdivisions;
        const cellHeight = (bbox.maxY - bbox.minY) / subdivisions;

        const subPolygons = [];

        // Créer une grille de sous-rectangles
        for (let i = 0; i < subdivisions; i++) {
            for (let j = 0; j < subdivisions; j++) {
                const cellMinX = bbox.minX + i * cellWidth;
                const cellMaxX = bbox.minX + (i + 1) * cellWidth;
                const cellMinY = bbox.minY + j * cellHeight;
                const cellMaxY = bbox.minY + (j + 1) * cellHeight;

                // Vérifier si cette cellule intersecte le polygon original
                if (!cellIntersectsPolygon(cellMinX, cellMaxX, cellMinY, cellMaxY, polygon.coordinates)) {
                    continue; // Ignorer cette cellule
                }

                // Créer un polygon rectangulaire pour cette cellule
                const cellPolygon = {
                    type: "Polygon",
                    coordinates: [[
                        [cellMinX, cellMinY],
                        [cellMaxX, cellMinY],
                        [cellMaxX, cellMaxY],
                        [cellMinX, cellMaxY],
                        [cellMinX, cellMinY]
                    ]]
                };

                subPolygons.push(cellPolygon);
            }
        }

        return subPolygons;
    };

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
            .then(({ data }) => data)
            .catch(error => {
                console.error("Erreur lors du reverse geocoding:", error);
                return [];
            });
    };

    /**
     * Déduplique les résultats basés sur un identifiant unique
     */
    const deduplicateResults = results => {
        const seen = new Set();
        const deduplicated = [];

        for (const item of results) {
            // Créer une clé unique basée sur les propriétés importantes
            const key = item?.properties ?
                `${item.properties.id || ''}_${item.properties.name || ''}_${item.properties.housenumber || ''}_${item.properties.street || ''}` :
                JSON.stringify(item);

            if (!seen.has(key)) {
                seen.add(key);
                deduplicated.push(item);
            }
        }

        return deduplicated;
    };

    /**
     * Traite un polygon en le subdivisant si nécessaire et en exécutant les requêtes
     */
    const processPolygon = polygon => {
        try {
            const subPolygons = subdividePolygon(polygon, 1000);
            return Promise.all(subPolygons.map(request))
                .then(results => results.filter(r => Array.isArray(r) || r));
        } catch (error) {
            console.error("Erreur lors du traitement du polygon:", error);
            return Promise.resolve([]);
        }
    };

    // Traitement MultiPolygon
    if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates)) {
        const polygons = geometry.coordinates.map(coords => ({
            type: "Polygon",
            coordinates: coords
        }));

        return Promise.all(polygons.map(processPolygon))
            .then(results => {
                // Aplatir les résultats (array de arrays de arrays)
                const flatResults = results.flat(2).filter(item => item);
                // Dédupliquer
                return deduplicateResults(flatResults);
            })
            .catch(error => {
                console.error("Erreur lors du traitement MultiPolygon:", error);
                return [];
            });
    }

    // Traitement Polygon simple
    if (geometry.type === "Polygon") {
        return processPolygon(geometry)
            .then(results => {
                const flatResults = results.flat().filter(item => item);
                return deduplicateResults(flatResults);
            })
            .catch(error => {
                console.error("Erreur lors du traitement Polygon:", error);
                return [];
            });
    }

    return request(geometry);
};

export const printPDF = (params) => {
    return axios.post(`${urbanismeURL}/print/report.pdf`, params);
};
