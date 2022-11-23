/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React, { useEffect } from "react";
import ADSIcon from '../../../../assets/img/ADS.png';

import Toolbar from "@mapstore/components/misc/toolbar/Toolbar";
import Message from "@mapstore/components/I18N/Message";
import {
    CONTROL_NAME,
    URBANISME_TOOLS,
    HELP_LINK_DEFAULT
} from "@js/extension/constants";
import LandPlanning from "@js/extension/components/LandPlanningViewer";
import {setAPIURL} from "@js/extension/api";

/**
 * UrbanismeToolbar component
 * @param {object} props Component props
 * @param {bool} props.enabled show/hide the toolbar panel
 * @param {object} props.urbanisme object with urbanisme state values and attributes
 * @param {func} props.onSetUp triggered when the component is initialized
 * @param {func} props.onToggleTool triggered on clicking the toolbar buttons
 * @param {func} props.onToggleControl triggered on clicking the close button of the toolbar
 * @param {string} props.helpUrl configured help link from the localConfig
 *
 */
const UrbanismeToolbar = ({
    enabled = false,
    urbanisme = {},
    onSetUp = () => {},
    onToggleTool = () => {},
    onToggleControl = () => {},
    helpUrl = HELP_LINK_DEFAULT,
    ...props
}) => {
    const { activeTool = '', showGFIPanel = false } = urbanisme;
    useEffect(() => {
        const { cadastrappUrl, layer, urbanismeappUrl, idParcelleKey, urbanismeRenseignGroupe} = props;
        setAPIURL({cadastrappUrl, urbanismeappUrl, urbanismeRenseignGroupe});
        onSetUp({ layer, idParcelleKey, urbanismeRenseignGroupe});
    }, [setAPIURL, onSetUp]);

    const { NRU, ADS } = URBANISME_TOOLS;
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
                        bsStyle: "primary",
                        tooltipPosition: "bottom"
                    }}
                    buttons={[
                        {
                            glyph: 'sheet',
                            tooltip: <Message msgId={'urbanisme.nru.tooltip'}/>,
                            bsStyle: activeTool === NRU ? "success" : "primary",
                            active: activeTool === NRU,
                            onClick: () => onToggleTool(activeTool === NRU ? null : NRU)
                        },
                        {
                            text: <img src={ADSIcon} style={{
                                width: 40,
                                position: "relative",
                                left: -
                                3
                            }}/>,
                            tooltip: <Message msgId={'urbanisme.ads.tooltip'}/>,
                            bsStyle: activeTool === ADS ? "success" : "primary",
                            active: activeTool === ADS,
                            onClick: () => onToggleTool(activeTool === ADS ? null : ADS)
                        },
                        {
                            glyph: "question-sign",
                            tooltip: <Message msgId={'urbanisme.landPlanning.help'}/>,
                            bsStyle: "primary",
                            onClick: () =>
                                window.open(
                                    helpUrl,
                                    '_blank'
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
