/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Table } from "react-bootstrap";
import Message from "@mapstore/components/I18N/Message";

/**
 * NRUInfo component
 * @param {object} props Component props
 * @param {object} props object containing attributes of NRU data
 */
const NRUInfo = (props) => {
    const type = [...new Set(props?.groupesLibelle?.flatMap(item => item.type))].join(', ');
    const reverseFeatures = Array.isArray(props?.reverseGeocoding)
        ? props.reverseGeocoding.flatMap(response => response?.features || [])
        : (props?.reverseGeocoding?.features || []);
    const reverseAddresses = [...new Set(
        reverseFeatures
            .map(feature => feature?.properties?.name)
            .filter(Boolean)
    )];
    const postalAddresses = props?.adressesPostales || [];
    const legalAddresses = [...new Set([...postalAddresses, ...reverseAddresses])];
    const tableData = [
        {
            id: "section",
            label: <Message msgId={"urbanisme.nru.section"}/>,
            value: props.codeSection || ''
        },
        {
            id: "plotNumber",
            label: <Message msgId={"urbanisme.nru.plotNumber"}/>,
            value: props.numero || ''
        },
        {
            id: "address",
            label: <Message msgId={"urbanisme.nru.address"}/>,
            value: props.adresseCadastrale || ''
        },
        {
            id: "legalAddresses",
            label: <Message msgId={"urbanisme.nru.legalAddresses"}/> ,
            value: legalAddresses.length
                ? legalAddresses.map((address, index) => (
                    <span key={address}>
                        {address}
                        {index < legalAddresses.length - 1 ? <br/> : null}
                    </span>
                ))
                : ''
        },
        {
            id: "capacity",
            label: <Message msgId={"urbanisme.nru.capacity"}/>,
            value: props.contenanceDGFiP || ''
        },
        {
            id: "area",
            label: <Message msgId={"urbanisme.nru.area"}/>,
            value: props.surfaceSIG || ''
        },
        {
            id: "account",
            label: <Message msgId={"urbanisme.nru.account"}/>,
            value: props.codeProprio || ''
        },
        {
            id: "owner",
            label: <Message msgId={"urbanisme.nru.owner"}/>,
            value: props.nomProprio || ''
        },
        {
            id: "productionDate",
            label: <Message msgId={"urbanisme.nru.productionDate"}/>,
            value: props.dateRU || ''
        },
        {
            id: "year",
            label: <Message msgId={"urbanisme.nru.year"}/>,
            value: props.datePCI || ''
        },
        {
            id: "documents",
            label: <Message msgId={"urbanisme.nru.documents"}/>,
            value: type || ''
        }
    ];

    return (
        <div className="parcelle_nru">
            <h2>
                <Message msgId={"urbanisme.nru.title"} />
            </h2>
            <h3 style={{ fontWeight: 500 }}>{props.parcelle}</h3>
            <Table className="table-parcelle">
                <thead>
                    <tr>
                        <td className="parcelle-table-label">
                            <Message msgId={"urbanisme.nru.territory"} />{" "}
                        </td>
                        <td className="parcelle-table-value">{props.commune || ''}</td>
                    </tr>
                </thead>
                <tbody>
                    {
                        tableData.map(({label, value, id})=>{
                            return (<tr key={id}>
                                <td className="parcelle-table-label">{label}</td>
                                <td className="parcelle-table-value">{value}</td>
                            </tr>);
                        })
                    }
                </tbody>
            </Table>
            <div>
                {(props?.groupesLibelle) ?
                    (props.groupesLibelle || []).map(groupe => (
                        (groupe.libelles || []).map(libelle => (
                            <p className="libelle" dangerouslySetInnerHTML={{ __html: libelle }}></p>))
                    )) :
                    (props.libelles || []).map(libelle => (
                        <p className="libelle" dangerouslySetInnerHTML={{ __html: libelle }}></p>
                    ))}
            </div>
        </div>
    );
};

export default NRUInfo;
