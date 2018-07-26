const path = require('path');
const fs = require('fs');

function view (app, opts = {}) {
    const {baseDir = ''} = opts;
    app.context.view = function (page = '', obj = {}) {
        let ctx = this;
        let filepath = path.join(baseDir, page);
        if (fs.existsSync(filepath)) {
            let tpl = fs.readFileSync(filepath, 'binary');
            ctx.body = tpl;
        } else {
            ctx.throw(404);
        }
    }
}
module.exports = view;