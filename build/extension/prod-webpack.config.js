
const path = require("path");

const createExtensionWebpackConfig = require('../../MapStore2/build/createExtensionWebpackConfig');
const CopyPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const {name} = require('../../config');
const { plugins: commonsPlugins, ...commons} = require('./commons');

// the build configuration for production allow to create the final zip file, compressed accordingly
const plugins = [
    new CopyPlugin([
        { from: path.resolve(__dirname, "..", "..", "assets", "translations"), to: "translations" },
        { from: path.resolve(__dirname, "..", "..", "assets", "index.json"), to: "index.json" }
    ]),
    new ZipPlugin({
        filename: `${name}.zip`,
        pathMapper: assetPath => {
            if (assetPath.startsWith('translations') || assetPath.startsWith('assets')) {
                return assetPath;
            }
            // other files have to be placed in the root, with the same name
            return path.basename(assetPath);
        }
    }),
    ...commonsPlugins
];

// Temporary TODO: Has to be updated in createExtensionWebpackConfig
const fileLoader = {
    test: /\.(ttf|eot|svg)(\?v=[0-9].[0-9].[0-9])?$/,
    use: [{
        loader: 'file-loader',
        options: {
            name: "[name].[ext]"
        }
    }]
};
const urlLoader = {
    test: /\.woff(2)?(\?v=[0-9].[0-9].[0-9])?$/,
    use: [{
        loader: 'url-loader',
        options: {
            mimetype: "application/font-woff"
        }
    }]
};
const {module: moduleObj, ...extensionConfig} = createExtensionWebpackConfig({ prod: true, name, ...commons, plugins});
module.exports = { ...extensionConfig, module: {...moduleObj, rules: [...moduleObj.rules, fileLoader, urlLoader]}};
