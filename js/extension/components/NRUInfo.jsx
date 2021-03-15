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
    const tableData = [
        {
            label: <Message msgId={"urbanisme.nru.section"}/>,
            value: props.codeSection || ''
        },
        {
            label: <Message msgId={"urbanisme.nru.plotNumber"}/>,
            value: props.numero || ''
        },
        {
            label: <Message msgId={"urbanisme.nru.address"}/>,
            value: props.adresseCadastrale || ''
        },
        {
            label: <Message msgId={"urbanisme.nru.capacity"}/>,
            value: props.contenanceDGFiP || ''
        },
        {
            label: <Message msgId={"urbanisme.nru.area"}/>,
            value: props.surfaceSIG || ''
        },
        {
            label: <Message msgId={"urbanisme.nru.account"}/>,
            value: props.codeProprio || ''
        },
        {
            label: <Message msgId={"urbanisme.nru.owner"}/>,
            value: props.nomProprio || ''
        },
        {
            label: <Message msgId={"urbanisme.nru.productionDate"}/>,
            value: props.dateRU || ''
        },
        {
            label: <Message msgId={"urbanisme.nru.year"}/>,
            value: props.datePCI || ''
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
                        tableData.map(({label, value}, i)=>{
                            return (<tr key={i}>
                                <td className="parcelle-table-label">{label}</td>
                                <td className="parcelle-table-value">{value}</td>
                            </tr>);
                        })
                    }
                </tbody>
            </Table>
            <div>
                {(props.libelles || []).map(libelle => (
                    <p className="libelle" dangerouslySetInnerHTML={{ __html: libelle }}></p>
                ))}
            </div>
        </div>
    );
};

export default NRUInfo;
