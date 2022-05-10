
import {mapLayoutSelector} from "@mapstore/selectors/maplayout";
import {memoize} from "lodash";

export const boundingSidebarRectSelector = (state) => state.maplayout && state.maplayout.boundingSidebarRect || {};

/**
 * Retrieve only specific attribute from map layout
 * @function
 * @memberof selectors.mapLayout
 * @param  {object} state the state
 * @param  {object} attributes attributes to retrieve, bool {left: true}
 * @param  {boolean} isDock flag to use dock paddings instead of toolbar paddings
 * @return {object} selected attributes of layout of the map
 */
export const mapLayoutValuesSelector = memoize((state, attributes = {}, isDock = false) => {
    const layout = mapLayoutSelector(state);
    const boundingSidebarRect = boundingSidebarRectSelector(state);
    return layout && Object.keys(layout).filter(key =>
        attributes[key]).reduce((a, key) => {
        if (isDock) {
            return ({...a, [key]: (boundingSidebarRect[key] ?? layout[key])});
        }
        return ({...a, [key]: layout[key]});
    },
    {}) || {};
}, (state, attributes, isDock) =>
    JSON.stringify(mapLayoutSelector(state)) +
    JSON.stringify(boundingSidebarRectSelector(state)) +
    JSON.stringify(attributes) + (isDock ? '_isDock' : ''));
