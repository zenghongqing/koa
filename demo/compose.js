function compose(middleware) {
    if (!Array.isArray(middleware)) {
        throw new Error('Middleware stack must be an array');
    }
    return (ctx, next) => {
        let index = -1;
        return dispatch(0);
        function dispatch(i) {
            if (i < index) {
                throw Promise.reject(new Error('next() called multiple times'));
            }
            index = i;
            let fn = middleware[i];
            console.log(fn)
            if (i === middleware.length) {
                fn = next;
            }
            if (!fn) {
                return Promise.resolve();
            }
            try {
                // return Promise.resolve(fn(ctx, () => {
                //     return dispatch(i + 1);
                // }));
                console.log(i, 'i')
                return Promise.resolve(fn(ctx, () => {
                    return dispatch(i + 1);
                }))
            } catch (err) {
                return Promise.reject(err)
            }
        }
    }
}
module.exports = compose;