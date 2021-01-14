/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import isEmpty from "lodash/isEmpty";
import Message from "@mapstore/components/I18N/Message";

/**
 * ADSInfo component
 * @param {object} props Component props
 * @param {object} props object containing attributes of ADS data
 */
const ADSInfo = ({
    id_parcelle = "",
    nom = "",
    ini_instru = "",
    num_dossier = [],
    num_nom = ""
}) => {
    return (
        <div className="parcelle_ads">
            <h2>
                <Message msgId={"urbanisme.ads.parcelle"} />
            </h2>
            <h3 style={{ fontWeight: 500 }}>{id_parcelle}</h3>
            <h3>
                <Message msgId={"urbanisme.ads.secteur"} /> :
            </h3>
            {isEmpty(nom) && isEmpty(ini_instru) ? (
                <Message msgId={"urbanisme.ads.emptyNom"} />
            ) : (
                <span>
                    {nom} / {ini_instru}
                </span>
            )}
            <h3>
                <Message msgId={"urbanisme.ads.listOfAds"} /> :
            </h3>
            <ul>
                {num_dossier.map(n => (
                    <li>{n}</li>
                ))}
            </ul>
            <h3>
                <Message msgId={"urbanisme.ads.quartier"} /> :
            </h3>
            {isEmpty(num_nom) ? (
                <Message msgId={"urbanisme.ads.emptyNumNom"} />
            ) : (
                <span>{num_nom}</span>
            )}
        </div>
    );
};

export default ADSInfo;
