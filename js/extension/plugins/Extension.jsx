import React from "react";
import { connect } from "react-redux";
import { toggleControl } from "@mapstore/actions/controls";

import {Glyphicon} from 'react-bootstrap';
import Message from "@mapstore/components/I18N/Message";
import '../../assets/style.css';

const CONTROL_NAME = "urbanisme";


const compose = (...functions) => args => functions.reduceRight((arg, fn) => fn(arg), args);

const Cadastrapp = compose(
    connect((state) => ({
        enabled: state.controls && state.controls[CONTROL_NAME] && state.controls[CONTROL_NAME].enabled || false,
        withButton: false
    }), {
        onClose: toggleControl.bind(null, CONTROL_NAME, null)
    })
)(({ enabled }) => <div style={{
    display: enabled ? "block" : "none"
}} id="urbanisme-button-bar">Urbanisme</div>);

export default {
    name: "Urbanisme",
    component: Cadastrapp,
    reducers: {},
    epics: {},
    containers: {
        BurgerMenu: {
            name: "urbanisme",
            position: 1050,
            text: <Message msgId="urbanisme.title"/>,
            icon: <Glyphicon glyph="th" />,
            doNotHide: true,
            action: toggleControl.bind(null, CONTROL_NAME, null),
            priority: 1
        }
    }
};
