const path = require("path");

const themeEntries = require('./MapStore2/build/themes.js').themeEntries;
const extractThemesPlugin = require('./MapStore2/build/themes.js').extractThemesPlugin;
const ModuleFederationPlugin = require('./MapStore2/build/moduleFederation').plugin;
const HtmlWebpackPlugin = require('html-webpack-plugin');

const paths = {
    base: __dirname,
    dist: path.join(__dirname, "dist"),
    framework: path.join(__dirname, "MapStore2", "web", "client"),
    code: [path.join(__dirname, "js"), path.join(__dirname, "MapStore2", "web", "client")]
};

module.exports = require('./MapStore2/build/buildConfig')(
    {
        'MapStoreExtension': path.join(__dirname, "js", "app"),
        'MapStoreExtension-embedded': path.join(__dirname, "MapStore2", "web", "client", "product", "embedded"),
        'MapStoreExtension-api': path.join(__dirname, "MapStore2", "web", "client", "product", "api")
    },
    themeEntries,
    paths,
    [extractThemesPlugin, ModuleFederationPlugin],
    true,
    "dist/",
    '.MapStoreExtension',
    [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'indexTemplate.html'),
            chunks: ['MapStoreExtension'],
            inject: "body",
            hash: true
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'embeddedTemplate.html'),
            chunks: ['MapStoreExtension-embedded'],
            inject: "body",
            hash: true,
            filename: 'embedded.html'
        }),
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'apiTemplate.html'),
            chunks: ['MapStoreExtension-api'],
            inject: 'head',
            hash: true,
            filename: 'api.html'
        })
    ],
    {
        "@mapstore/patcher": path.resolve(__dirname, "node_modules", "@mapstore", "patcher"),
        "@mapstore": path.resolve(__dirname, "MapStore2", "web", "client"),
        "@js": path.resolve(__dirname, "js")
    }
);
