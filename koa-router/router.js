const methods = [
    'GET',
    'PUT',
    'PATCH',
    'POST',
    'DELETE'
];
class Layer {
    constructor (path, methods, middleware, opts) {
        this.path = path;
        this.methods = methods;
        this.middleware = middleware;
        this.opts = opts;
    }
}
class Router {
    constructor (opts = {}) {
        this.stack = [];
    }
    register (path, methods, middleware) {
        let route = new Layer(path, methods, middleware);
        this.stack.push(route);
        return this;
    }
    routes () {
        let stock = this.stack;
        return async (ctx ,next) => {
            let currentPath = ctx.path;
            let route;
            for (let i = 0; i < stock.length; i++) {
                let item = stock[i];
                if (item.path === currentPath && methods.includes(item.methods)) {
                    route = item.middleware;
                    break;
                }
            }
            if (typeof route === 'function') {
                route(ctx, next)
                return;
            }
            await next();
        }
    }
}

methods.forEach((method) => {
    Router.prototype[method.toLowerCase()] = Router.prototype[method] = function (path, middleware) {
        this.register(path, method, middleware)
    };
})

module.exports = Router;