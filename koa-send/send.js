const path = require('path');

const fs = require('fs');
// basename: 提取出用 ‘/' 隔开的path的最后一部分
// extname: 返回path路径文件扩展名
const { basename, extname } = path;

const defaultOpts = {
    root: '',
    maxage: '',
    immutable: false,
    extensions: false,
    hidden: false,
    brotli: false,
    gzip: false,
    setHeaders: () => {}
};

async function send(ctx, urlPath, opts = defaultOpts) {
    const { root, maxage, immutable, extensions, hidden, brotli, gzip, setHeaders } = opts;
    let filePath = urlPath;
    // 配置静态资源绝对目录地址
    try {
        filePath = decodeURIComponent(filePath);
        // 检测路径的合法性
        if (/[\.]{2,}/ig.test(filePath)) {
            ctx.throw(403, 'Forbidden');
        }
    } catch (err) {
        ctx.throw(400, 'fail to decode');
    }
    filePath = path.join(root, urlPath);
    console.log(filePath)
    const filebasename = basename(filePath);
    // 判断是否支持隐藏文件
    if (hidden !== true && filebasename.startsWith('.')) {
        ctx.throw(404, 'not found');
        return;
    }
    // 获取文件或目录信息
    let statObj;
    try {
        statObj = fs.statSync(filePath);;
        if (statObj.isDirectory()) {
            ctx.throw(404, '404 Not Found');
            return;
        }
    } catch (err) {
        const notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR']
        if (notfound.includes(err.code)) {
            ctx.throw(404, '404 not found');
            return;
        }
        err.status = 500;
        throw err;
    }
    let encodingExt = '';
    // 判断是否需要压缩
    if (ctx.acceptsEncodings('br', 'identity') === 'br' && brotli && fs.existsSync(filePath + '.br')) {
        filePath = filePath + '.br';
        ctx.set('Content-Encoding', 'br');
        ctx.res.removeHeader('Content-Length');
        encodingExt = '.br';
    } else if (ctx.acceptsEncodings('gzip', 'identity') === 'gzip' && fs.existsSync(filePath + '.gz')) {
        filePath = filePath + '.gz';
        ctx.set('Content-Encoding', 'gz');
        ctx.res.removeHeader('Content-Length');
        encodingExt = '.gz';
    }
    // 设置HTTP头信息
    if (typeof setHeaders === 'function') {
        setHeaders(ctx, urlPath, statObj);
    }
    ctx.set('Content-Length', statObj.size);
    if (!ctx.response.get('Last-Modified')) {
        ctx.set('Last-Modified', statObj.mtime.toUTCString());
    }
    if (!ctx.response.get('Cache-Control')) {
        const directives = ['max-age=' + (maxage / 1000 | 0)];
        if (immutable) {
            directives.push('immutable');
        }
        ctx.set('Cache-Control', directives.join(','));
    }
    const ctxType = encodingExt !== '' ? extname(basename(filePath,encodingExt)) : extname(filePath);
    ctx.type = ctxType;
    // 静态文件读取
    ctx.body = fs.createReadStream(filePath);
}

module.exports = send;