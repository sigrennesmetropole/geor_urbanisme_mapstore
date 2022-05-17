// this configuration emulates the real loading of `extensions.json` and
// maps the extension files (running with `npm run ext:start`) to the `/extension/` path

const webpackConfig = require("../../webpack.config");
const { name } = require('../../config');

// emulate the extension root directory
webpackConfig.devServer.proxy["/extensions/"] = {
    target: "http://localhost:8082"
};
// emulate the extensions.json
webpackConfig.devServer.before = function(app) {
    app.get("/extensions/extensions.json", function(req, res) {
        res.json({
            [name]: {
                "bundle": "index.js",
                "translations": "translations"
            }
        });
    });
};
module.exports = webpackConfig;
