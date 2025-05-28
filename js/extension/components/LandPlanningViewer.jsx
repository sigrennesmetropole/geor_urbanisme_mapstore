/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Glyphicon } from "react-bootstrap";
import isEmpty from "lodash/isEmpty";
import Spinner from "react-spinkit";
import Dialog from "@mapstore/components/misc/Dialog";
import Button from "@mapstore/components/misc/Button";
import Loader from "@mapstore/components/misc/Loader";
import NRUInfo from "./NRUInfo";
import ADSInfo from "./ADSInfo";
import { ADS_DEFAULTS, URBANISME_TOOLS } from "@js/extension/constants";
import Message from "@mapstore/components/I18N/Message";

/**
 * LandPlanningViewer component
 * @param {object} props Component props
 * @param {object} props.urbanisme object containing attributes of NRU/ADS data
 * @param {func} props.onTogglePanel triggered on closing the LandPlanning viewer panel
 * @param {func} props.onPrint triggered on printing the NRU/ADS attributes to PDF
 *
 */
const LandPlanningViewer = ({
    urbanisme = {},
    onTogglePanel = () => {},
    onPrint = () => {}
}) => {
    const {
        attributes = {},
        activeTool = "",
        dataLoading: loading = false,
        printing = false
    } = urbanisme || {};
    const printDisabled = loading || isEmpty(attributes) || printing;
    const { NRU, ADS } = URBANISME_TOOLS;

    const closePanel = () => onTogglePanel(false);

    const Viewer = () => {
        if (isEmpty(attributes)) return <p>No data to display</p>;
        if (activeTool === NRU) {
            return <NRUInfo {...attributes}/>;
        } else if (activeTool === ADS) {
            return <ADSInfo {...attributes}/>;
        }
        return null;
    };

    const getLibelles = (groupesLibelle, numero) => {
        const groupes = groupesLibelle.find(groupe => groupe?.groupe_ru === numero);
        if (groupes) {
            return (groupes?.libelles || []).join("<br/>");
        }
        return "";
    };

    const onSubmitPrint = () => {
        let paramAttributes = {};
        // NRU print param attributes
        if (activeTool === NRU) {
            paramAttributes = {
                parcelle: attributes.parcelle || "",
                commune: attributes.commune || "",
                codeSection: attributes.codeSection || "",
                numero: attributes.numero || "",
                adresseCadastrale: attributes.adresseCadastrale || "",
                contenanceDGFiP: attributes.contenanceDGFiP || "",
                surfaceSIG: attributes.surfaceSIG || "",
                codeProprio: attributes.codeProprio || "",
                nomProprio: attributes.nomProprio || "",
                adresseProprio: attributes.adresseProprio || "",
                dateRU: attributes.dateRU || "",
                datePCI: attributes.datePCI || "",
                outputFilename: "NRU_" + attributes.parcelle
            };
            if (!!attributes?.groupesLibelle) {
                paramAttributes = {
                    ...paramAttributes,
                    libelles_1: getLibelles(attributes?.groupesLibelle, '1'),
                    libelles_2: getLibelles(attributes?.groupesLibelle, '2'),
                    libelles_311: getLibelles(attributes?.groupesLibelle, '311'),
                    libelles_312: getLibelles(attributes?.groupesLibelle, '312'),
                    libelles_313: getLibelles(attributes?.groupesLibelle, '313'),
                    libelles_314: getLibelles(attributes?.groupesLibelle, '314'),
                    libelles_315: getLibelles(attributes?.groupesLibelle, '315'),
                    libelles_32: getLibelles(attributes?.groupesLibelle, '32'),
                    libelles_33: getLibelles(attributes?.groupesLibelle, '33'),
                    libelles_4: getLibelles(attributes?.groupesLibelle, '4'),
                    libelles_5: getLibelles(attributes?.groupesLibelle, '5'),
                    libelles_6: getLibelles(attributes?.groupesLibelle, '6'),
                    libelles_7: getLibelles(attributes?.groupesLibelle, '7'),
                    libelles_alertes: getLibelles(attributes?.groupesLibelle, '-999'),
                    adressesPostales: attributes.adressesPostales.join("; "),
                    intra: true,
                    mapImageStream: ""
                };
            } else {
                paramAttributes = {
                    ...paramAttributes,
                    libelles: (attributes.libelles || []).join("\n\n") || []
                };
            }
        } else if (activeTool === ADS) {
            // ADS print param attributes
            const { emptyNom, emptyNumNom } = ADS_DEFAULTS;
            const parcelle = attributes.id_parcelle || "";
            paramAttributes = {
                layout: "A4 portrait ADS", // Layout name specific for ADS
                instruction:
          isEmpty(attributes.nom) && isEmpty(attributes.ini_instru)
              ? emptyNom
              : attributes.nom + " / " + attributes.ini_instru,
                parcelle,
                numNom: isEmpty(attributes.num_nom) ? emptyNumNom : attributes.num_nom,
                numDossier: (attributes.num_dossier || []).join("\n\n"),
                outputFilename: "ADS_" + parcelle
            };
        }
        onPrint(paramAttributes);
    };

    return (
        <Dialog id={"modal-land-panel-dialog"}>
            <span
                role="header"
                style={{ display: "flex", justifyContent: "space-between" }}
            >
                <span>
                    <Message msgId={"urbanisme.title"} />
                </span>
                <button onClick={closePanel} className="close">
                    <Glyphicon glyph="1-close" />
                </button>
            </span>
            <div
                role="body"
                style={{ ...(!loading && { maxHeight: 400, overflow: "auto" }) }}
            >
                {loading ? (
                    <Loader
                        size={100}
                        style={{ margin: "0 auto" }}
                        className="data-loader"
                    />
                ) : (
                    <Viewer />
                )}
            </div>
            <span role="footer">
                <Button
                    disabled={printDisabled}
                    onClick={onSubmitPrint}
                    bsStyle="primary"
                    className="print"
                >
                    {printing ? (
                        <Spinner
                            spinnerName="circle"
                            noFadeIn
                            overrideSpinnerClassName="spinner"
                        />
                    ) : null}
                    <Message msgId={"urbanisme.landPlanning.print"} />
                </Button>
                <Button
                    disabled={loading}
                    onClick={closePanel}
                    bsStyle="primary"
                    className="cancel"
                >
                    <Message msgId={"urbanisme.landPlanning.cancel"} />
                </Button>
            </span>
        </Dialog>
    );
};

export default LandPlanningViewer;
