const Koa = require('koa');

const app = new Koa();

const send = require('./send');

app.use(async ctx => {
    if (ctx.url !== '/favicon.ico') {
        await send(ctx, ctx.path, {root: `${__dirname}/public`});
    }
});

app.listen(3000, function () {
    console.log('程序正在运行...');
});