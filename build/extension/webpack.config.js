
const createExtensionWebpackConfig = require('../../MapStore2/build/createExtensionWebpackConfig');

const { name } = require('../../config');
const { plugins: commonsPlugins, ...commons } = require('./commons');
const webpackConfig = createExtensionWebpackConfig({
    prod: false,
    name,
    ...commons,
    overrides: {
        // serve translations (and index.json)
        devServer: {
            publicPath: "/extensions/",
            contentBase: './assets',
            contentBasePublicPath: '/extensions/'
        }
    },
    plugins: [ ...commonsPlugins ]
});

module.exports = webpackConfig;
