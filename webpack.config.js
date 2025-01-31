const path = require("path");

const themeEntries = require('./MapStore2/build/themes.js').themeEntries;
const extractThemesPlugin = require('./MapStore2/build/themes.js').extractThemesPlugin;
const ModuleFederationPlugin = require('./MapStore2/build/moduleFederation').plugin;
const buildConfig = require('./MapStore2/build/buildConfig');
const proxyConfig = require('./proxyConfig');


const cfg = buildConfig(
    {
        'MapStoreExtension': path.join(__dirname, "js", "app"),
        'MapStoreExtension-embedded': path.join(__dirname, "MapStore2", "web", "client", "product", "embedded"),
        'MapStoreExtension-api': path.join(__dirname, "MapStore2", "web", "client", "product", "api")
    },
    themeEntries,
    {
        base: __dirname,
        dist: path.join(__dirname, "dist"),
        framework: path.join(__dirname, "MapStore2", "web", "client"),
        code: [path.join(__dirname, "js"), path.join(__dirname, "MapStore2", "web", "client")]
    },
    [extractThemesPlugin, ModuleFederationPlugin],
    false,
    "dist/",
    '.MapStoreExtension',
    [],
    {
        "@mapstore/patcher": path.resolve(__dirname, "node_modules", "@mapstore", "patcher"),
        "@mapstore": path.resolve(__dirname, "MapStore2", "web", "client"),
        "@js": path.resolve(__dirname, "js")
    },
    proxyConfig
);
// stream are needed here in code
cfg.resolve.fallback = {timers: false, http: false, https: false, zlib: false};
module.exports = cfg;
