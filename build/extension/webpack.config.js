
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

const fileLoader = {
    test: /\.(ttf|eot|svg)(\?v=\d.\d.\d)?$/,
    use: [{
        loader: 'file-loader',
        options: {
            name: "[name].[ext]"
        }
    }]
};
const urlLoader = {
    test: /\.woff(2)?(\?v=\d.\d.\d)?$/,
    use: [{
        loader: 'url-loader',
        options: {
            mimetype: "application/font-woff"
        }
    }]
};
const {module: moduleObj, ...extensionConfig} = webpackConfig;
module.exports = { ...extensionConfig, module: {...moduleObj, rules: [...moduleObj.rules, fileLoader, urlLoader]}};
