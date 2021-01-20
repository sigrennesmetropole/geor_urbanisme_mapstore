/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import axios from "@mapstore/libs/ajax";
import { isEmpty } from "lodash";

export const BASE_URL = "/cadastrapp/services";

/**
 * Retrieves the initial configuration for cadastrapp services
 * @returns {object} the configuration of the services containing base details of WMS/WFS services
 */
export function getConfiguration() {
    return axios.get(`${BASE_URL}/getConfiguration`).then(({ data }) => data);
}

export const getCommune = cgocommune => {
    return axios
        .get(`${BASE_URL}/getCommune`, { params: { cgocommune } })
        .then(({ data }) => {
            const [{ libcom_min: commune }] = data;
            return { commune };
        });
};

export const getParcelle = code => {
    return axios
        .get(`${BASE_URL}/getParcelle`, { params: { parcelle: code } })
        .then(({ data }) => {
            if (!isEmpty(data)) {
                const [
                    {
                        parcelle,
                        ccopre,
                        ccosec,
                        dnupla: numero,
                        dnvoiri,
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
                if (dnvoiri || cconvo || dvoilib) {
                    parcelleObj.adresseCadastrale =
            dnvoiri + " " + cconvo + " " + dvoilib;
                } else {
                    parcelleObj.adresseCadastrale = "";
                }
                return parcelleObj;
            }
            return null;
        });
};

export const getRenseignUrba = parcelle => {
    return axios
        .get(`/urbanisme/renseignUrba`, { params: { parcelle } })
        .then(({ data }) => {
            return { libelles: (data?.libelles || []).map(({ libelle }) => libelle) };
        });
};

export const getFIC = (parcelle, onglet) => {
    return axios
        .get(`${BASE_URL}/getFIC`, { params: { parcelle, onglet } })
        .then(({ data }) => {
            if (isEmpty(data)) {
                return null;
            }
            const [record] = data;
            if (onglet === 0) {
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
          dlign4.trim() + " " + dlign5.trim() + " " + dlign6.trim();
                return { ...parcelleObj, codeProprio, adresseProprio };
            }
            return { surfaceSIG: record?.surfc || "" };
        });
};

export const getRenseignUrbaInfos = code => {
    return axios
        .get("/urbanisme/renseignUrbaInfos", { params: { code_commune: code } })
        .then(({ data }) => {
            if (isEmpty(data)) {
                return null;
            }
            return { datePCI: data.date_pci.slice(3, 10), dateRU: data.date_ru };
        });
};

export const getAdsSecteurInstruction = parcelle => {
    return axios
        .get("/urbanisme/adsSecteurInstruction", { params: { parcelle } })
        .then(({ data }) => {
            if (isEmpty(data)) {
                return null;
            }
            return { nom: data.nom, ini_instru: data.ini_instru };
        });
};

export const getAdsAutorisation = parcelle => {
    return axios
        .get("/urbanisme/adsAutorisation", { params: { parcelle } })
        .then(({ data }) => {
            if (isEmpty(data)) {
                return null;
            }
            const { numdossier = [] } = data;
            const ads = "Aucun ADSInfo trouvé pour la parcelle";
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
        .get("/urbanisme/quartier", { params: { parcelle } })
        .then(({ data }) => {
            if (isEmpty(data)) {
                return null;
            }
            return { num_nom: data.numnom, id_parcelle: data.parcelle };
        });
};
