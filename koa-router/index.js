const Koa = require('koa');
const app = new Koa();

const Router = require('./router');

const router = new Router();

// 注册路由信息缓存到实例中

router.get('/index', async ctx => {ctx.body = 'index page'});
router.get('/post', async ctx => {ctx.body = 'post page'});
router.get('/list', async ctx => {ctx.body = 'list page'});

app.use(router.routes());

app.use(async ctx => {
    ctx.body = '404';
});

app.listen(3000);
console.log('listening on port 3000');



