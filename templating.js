const nunjucks = require('nunjucks');

function createEnv(path, opts) {
    var
        autoescape = opts.autoescape === undefined ? true : opts.autoescape,
        noCache = opts.noCache || false,
        watch = opts.watch || false,
        throwOnUndefined = opts.throwOnUndefined || false,
        env = new nunjucks.Environment(
            //只在 node 端可用，他可从文件系统中加载模板，Path为查找模板的路径，可以是一个也可以是多个，默认为当前的工作目录。
            new nunjucks.FileSystemLoader(path || './views', {
                noCache: noCache, // 如果为 true，不使用缓存，模板每次都会重新编译
                watch: watch, // 如果为 true，当文件系统上的模板变化了，系统会自动更新他
            }), {
                autoescape: autoescape, //(默认值: true) 控制输出是否被转义
                throwOnUndefined: throwOnUndefined //(default: false) 当输出为 null 或 undefined 会抛出异常
            });
    if (opts.filters) {
        for (var f in opts.filters) {
            env.addFilter(f, opts.filters[f]);
        }
    }
    return env;
}

function templating(path, opts) {
    // 创建Nunjucks的env对象:
    var env = createEnv(path, opts);
    return async(ctx, next) => {
        // 给ctx绑定render函数:
        ctx.render = function(view, model) {
            // 把render后的内容赋值给response.body:
            //env.render(name,[context])作用是渲染name模板，使用context为数据
            ctx.response.body = env.render(view, Object.assign({}, ctx.state || {}, model || {}));
            // 设置Content-Type:
            ctx.response.type = 'text/html';
        };
        // 继续处理请求:
        await next();
    };
}

module.exports = templating;