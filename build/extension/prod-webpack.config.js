
const path = require("path");

const createExtensionWebpackConfig = require('../../MapStore2/build/createExtensionWebpackConfig');
const CopyPlugin = require('copy-webpack-plugin');
const ZipPlugin = require('zip-webpack-plugin');
const {name} = require('../../config');
const commons = require('./commons');

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
    })
];
module.exports = createExtensionWebpackConfig({ prod: true, name, ...commons, plugins});
