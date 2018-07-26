### Koa框架
由Express框架原班人马打造，致力于成为一个更小、更健壮、更富有表现力的web框架。使用koa编写的web应用，通过组合不同的generator(支持了es7的async/await)，可以免除重复繁琐的回调嵌套，并极大地提升常用错误处理效率。
Koa不在内核方法中绑定任何中间件，它仅仅提供了一个轻量优雅的函数库，使得编写Web应用和API更方便。

用途：
* 网站(如cnode论坛)
* api (三端: pc、移动端、H5)
* 与其他模块搭配，比如和socket.io搭配写弹幕、im(即时聊天)等

### 什么是中间件？
中间件是Application提供请求处理的扩展机制，主要抽象HTTP协议里的request、response
http协议是无状态协议，所以http请求的过程可以理解为，请求(request)过来，经过无数中间件拦截，直至响应(response)为止.

### 上下文(Context)
Koa Context将node的request和response对象封装到单个对象ctx中，为Web应用程序和API提供了许多有用的方法.
如:
ctx.req: Node的request对象

ctx.res: Node的response对象, 绕过Koa的response处理是不被支持的，应避免使用以下node属性:
* res.statusCode
* res.writeHead()
* res.write()
* res.end()

ctx.request: Koa的Request对象

ctx.response: Koa的Response对象

ctx.state: 推荐的命名空间，用于通过中间件传递信息和你的前端视图
```
    ctx.state.user = await User.find(id);
```
ctx.app: 应用程序实力引用

ctx.cookies.get(name, [options]): 通过options获取cookie name
* signed 所请求的cookie应该被签名

ctx.cookies.set(name, value, [options]): 通过options设置cookie name的value

ctx.throw([status], [msg], [properties]): 
```
    ctx.throw(400, 'name required', {user: user});
```

ctx.query
这里的query是querystring的别名
说明: ctx.query不一定是get请求，因为querystring可以存在get或post请求里

ctx.request.body
ctx.request.body一定是post请求，因为get的请求头里没有request.body。并且在koa中没有内置，需要依赖的中间件bodyParser，不然ctx.request.body是没有的。
```
    npm install koa-bodyparser@next --save
```
包含在请求正文中提交的键值对数据，默认是undefined，当使用body-parser和multer中间件时ctx.request.body是内置在中间件中的

ctx.params(暂时不能用)

```
    const Koa = require('koa');
    const router = require ('koa-router')();
    const app = new Koa();
    
    app.use(router.routes())
       .use(router.allowedMethods());
    
    router.get('/user/:id', function (ctx,next){
        ctx.body = 'user ' + ctx.params.id; 
    });
    
    app.listen(3000);
```

ctx.response: 是一个字符串，无法进行pipe操作，可以直接ctx.body=, 然后设置ctx.set('Content-Type', 'text/html')或者ctx.response.type。

###  koa中间件原理
koa的核心思想就是洋葱模型(中间件模型),借助compose这个库来实现。
```
/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware
 * @return {Function}
 * @api public
 */

function compose (middleware) {
  if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  for (const fn of middleware) {
    if (typeof fn !== 'function') throw new TypeError('Middleware must be composed of functions!')
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    // 记录上一次执行中间件的位置 #
    let index = -1
    return dispatch(0)
    function dispatch (i) {
      // 理论上 i 会大于 index，因为每次执行一次都会把 i递增，
      // 如果相等或者小于，则说明next()执行了多次
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      // 取到当前的中间件
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(context, function next () {
          // 递归处理push到middleware数组中的中间件函数
          return dispatch(i + 1)
        }))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}
```

