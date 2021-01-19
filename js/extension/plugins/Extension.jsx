/*
 * Copyright 2021, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Glyphicon } from "react-bootstrap";
import { connect } from "react-redux";
import { createSelector } from 'reselect';

import { toggleControl } from "@mapstore/actions/controls";
import Message from "@mapstore/components/I18N/Message";
import {updateObjectFieldKey} from "@mapstore/utils/MapUtils";

import UrbanismeToolbar from "./urbanisme/UrbanismeToolbar";
import urbanismeEpic from "../epics/urbanisme";
import urbanismeReducer from "../reducers/urbanisme";
import {
    setUp,
    toggleGFIPanel,
    printSubmit,
    toggleUrbanismeTool
} from "../actions/urbanisme";
import { CONTROL_NAME } from "../constants";
import "../../assets/style.css";
import {configLoadedSelector, configSelector} from "@js/extension/selectors/urbanisme";

const Urbanisme = connect(
    state => ({
        enabled: state?.controls?.urbanisme?.enabled || false,
        urbanisme: state?.urbanisme || {}
    }),
    {
        onSetUp: setUp,
        onTogglePanel: toggleGFIPanel,
        onToggleTool: toggleUrbanismeTool,
        onToggleControl: toggleControl,
        onPrint: printSubmit
    }
)(UrbanismeToolbar);

/**
 * Update epics name to plugin specific
 */
const updateEpicsName = () => {
    Object.keys(urbanismeEpic).forEach(t=> updateObjectFieldKey(urbanismeEpic, t, 'urbanimse_' + t));
    return urbanismeEpic;
};

/**
 * Urbanisme tools Plugin. Allow to fetch NRU and ADS data on parcelle layer
 * and to print the data onto pdf
 *
 * @name Urbanisme
 * @memberof plugins
 * @prop {string} [enabled] flag to show/hide the plugin toolbar
 * @prop {object} [urbanisme] object containing all the properties specific for the plugin
 * @prop {function} [onSetUp] function used to set up initial configurations
 * @prop {function} [onTogglePanel] function used to toggle the display state of the viewer panel
 * @prop {function} [onToggleTool] function used to toggle tool to activate
 * @prop {function} [onToggleControl] function used to toggle state of the plugin toolbar
 * @prop {function} [onPrint] function used to print the attributes of NRU/ADS onto PDF
 * @prop {object} [cfg.helpLink] help link configured for the help tool
 * For example this will configure the following help link and upon clicking on the help button in the toolbar, the link will be displayed in new browser window
 * ```
 * "cfg": {
 *  "helpLink": 'http://docs.georchestra.org/addon_urbanisme/'
 *  }
 * ```
 */
const UrbanismePlugin = {
    name: "Urbanisme",
    component: Urbanisme,
    containers: {
        BurgerMenu: {
            name: CONTROL_NAME,
            text: <Message msgId="urbanisme.title" />,
            icon: <Glyphicon glyph="th-list" />,
            action: toggleControl.bind(null, CONTROL_NAME, null),
            selector: createSelector(
                configSelector,
                (configLoaded) => ({
                    style: !!configLoaded ? {} : { display: "none" } // Hide when config failed to load
                })
            ),
            position: 1501,
            doNotHide: true,
            priority: 2
        }
    },
    epics: updateEpicsName(),
    reducers: { urbanisme: urbanismeReducer }
};

export default UrbanismePlugin;
