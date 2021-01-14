/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect } from "react";

import Toolbar from "@mapstore/components/misc/toolbar/Toolbar";
import {
    CONTROL_NAME,
    URBANISME_TOOLS
} from "@js/extension/constants";
import LandPlanning from "@js/extension/components/LandPlanningViewer";

/**
 * UrbanismeToolbar component
 * @param {object} props Component props
 * @param {bool} props.enabled show/hide the toolbar panel
 * @param {object} props.urbanisme object with urbanisme state values and attributes
 * @param {func} props.onSetUp triggered when the component is initialized
 * @param {func} props.onToggleTool triggered on clicking the toolbar buttons
 * @param {func} props.onToggleControl triggered on clicking the close button of the toolbar
 * @param {string} props.helpLink configured help link from the localConfig
 *
 */
const UrbanismeToolbar = ({
    enabled = false,
    urbanisme = {},
    onSetUp = () => {},
    onToggleTool = () => {},
    onToggleControl = () => {},
    helpLink = '',
    ...props
}) => {
    const { activeTool = '', showGFIPanel = false } = urbanisme;
    useEffect(() => {
        onSetUp();
    }, [onSetUp]);

    const { NRU, ADS, HELP } = URBANISME_TOOLS;
    const panelStyle = {
        right: 5,
        zIndex: 100,
        position: "absolute",
        overflow: "auto",
        top: 58
    };

    if (!enabled) return null;

    return (
        <>
            <div className="urbanismeToolbar" style={panelStyle}>
                <Toolbar
                    btnDefaultProps={{
                        className: "square-button",
                        bsStyle: "primary"
                    }}
                    buttons={[
                        {
                            glyph: "zoom-to",
                            tooltip: NRU,
                            bsStyle: activeTool === NRU ? "success" : "primary",
                            active: activeTool === NRU,
                            onClick: () => onToggleTool(NRU)
                        },
                        {
                            glyph: "info-sign",
                            tooltip: ADS,
                            bsStyle: activeTool === ADS ? "success" : "primary",
                            active: activeTool === ADS,
                            onClick: () => onToggleTool(ADS)
                        },
                        {
                            glyph: "question-sign",
                            tooltip: HELP,
                            bsStyle: "primary",
                            onClick: () =>
                                window.open(
                                    helpLink,
                                    HELP,
                                    "menubar=no,status=no,scrollbars=yes"
                                )
                        },
                        {
                            glyph: "remove",
                            bsStyle: "primary",
                            onClick: () => onToggleControl(CONTROL_NAME)
                        }
                    ]}
                />
            </div>
            {showGFIPanel && <LandPlanning urbanisme={urbanisme} {...props} />}
        </>
    );
};

export default UrbanismeToolbar;
