/*
* Copyright 2020, GeoSolutions Sas.
* All rights reserved.
*
* This source code is licensed under the BSD-style license found in the
* LICENSE file in the root directory of this source tree.
*/

import React from 'react';
import { connect } from 'react-redux';
import { Glyphicon, Tooltip } from 'react-bootstrap';

import Button from '@mapstore/components/misc/Button';
import OverlayTrigger from '@mapstore/components/misc/OverlayTrigger';

import { nruActiveStateSelector } from '../../selectors/urbanisme';
import { toggleNru } from '../../actions/urbanisme';

const NruButton = (props) => {
    const {
        tooltip,
        tooltipPlacement = "left",
        onToggleNru = () => {},
        nruActive } = props;
    const id = "nru";
    const btnConfig = {
        className: "square-button"
    };
    const bsStyle = nruActive ? "success" : "primary";
    const btn = (
        <Button id={id + "_btn"} disabled={false} {...btnConfig} onClick={onToggleNru} bsStyle={bsStyle} style={{}}>
            <Glyphicon glyph="zoom-to" />
        </Button>
    );

    const tooltipComp = <Tooltip id={id + "_tooltip"}>{tooltip}</Tooltip>;
    return (
        <OverlayTrigger
            placement={tooltipPlacement}
            key={"overlay-trigger." + id} overlay={tooltipComp}>
            {btn}
        </OverlayTrigger>
    );
};

const Nru = connect((state) => ({
    nruActive: nruActiveStateSelector(state),
    tooltip: "NRU"
}), {
    onToggleNru: toggleNru
})(NruButton);

export default Nru;
