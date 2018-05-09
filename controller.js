const fs = require('fs');
const common = require('./common')
    // add url-route in /controllers:

function addMapping(router, mapping) {
    for (var url in mapping) {
        if (url.startsWith('GET ')) {
            var path = url.substring(4);
            router.get(path, mapping[url]);
            console.log(common.formatDateTime(new Date()) + `register URL mapping: GET ${path}`);
        } else if (url.startsWith('POST ')) {
            var path = url.substring(5);
            router.post(path, mapping[url]);
            console.log(common.formatDateTime(new Date()) + `register URL mapping: POST ${path}`);
        } else if (url.startsWith('PUT ')) {
            var path = url.substring(4);
            router.put(path, mapping[url]);
            console.log(common.formatDateTime(new Date()) + `register URL mapping: PUT ${path}`);
        } else if (url.startsWith('DELETE ')) {
            var path = url.substring(7);
            router.del(path, mapping[url]);
            console.log(common.formatDateTime(new Date()) + `register URL mapping: DELETE ${path}`);
        } else {
            //无效的URL
            console.log(common.formatDateTime(new Date()) + `invalid URL: ${url}`);
        }
    }
}

function addControllers(router, dir) {
    // 过滤出.js文件:
    fs.readdirSync(__dirname + '/' + dir).filter((f) => {
        return f.endsWith('.js');
    }).forEach((f) => {
        console.log(common.formatDateTime(new Date()) + `注册该文件下的路由: ${f}...`);
        // 导入js文件:
        let mapping = require(__dirname + '/' + dir + '/' + f);
        // console.log("新增：" + mapping);
        addMapping(router, mapping);
    });
}

module.exports = function(dir) {
    let
        controllers_dir = dir || 'controllers', // 如果不传参数，扫描目录默认为'controllers'
        router = require('koa-router')();
    addControllers(router, controllers_dir);
    return router.routes();
};