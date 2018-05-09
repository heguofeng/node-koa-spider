const koa = require('koa')
const bodyParser = require('koa-bodyparser')
const controller = require('./controller')
const rest = require('./rest')

const staticFiles = require('./static-files');
const templating = require('./templating')
const path = require('path')
const db = require('./db')
const CORS = require('koa2-cors')
const common = require('./common')
const webhttp = require('./webhttp')
const schedule = require('node-schedule'); //定时器
const app = new koa();
const crawler = require('./crawler');
const config = require('./config')

app.use(CORS())
    //声明当前不是开发环境
const isProduction = process.env.NODE_ENV === 'production';

app.use(async(ctx, next) => {
    console.log(`${common.formatDateTime(new Date())}Process ${ctx.request.method} ${ctx.request.url}... `);
    let start = new Date().getTime();
    let execTime;
    await next();
    execTime = new Date().getTime() - start;
    console.log("完成时间" + execTime + "ms");
    ctx.response.set('X-Response-Time', `${execTime}ms`);
});
// 第二 处理静态文件
app.use(staticFiles('/static/', path.join(__dirname, './static')));
//第三个解析POST请求
app.use(bodyParser());

// 第四个middleware负责给ctx加上render() 来使用Nunjucks：
app.use(templating(path.join(__dirname, './static'), {
    noCache: !isProduction,
    watch: !isProduction
}));

//给ctx绑定rest()方法
app.use(rest.restify());
//自动处理URL路由
app.use(controller());

let port = config.port;
let server = app.listen(port);
console.log(`${common.formatDateTime(new Date())}后台服务已启动，端口号：` + port);

crawler.downloadImg();
//定时间抓取数据
var rule = new schedule.RecurrenceRule();
rule.second = config.second;
rule.minute = config.minute;
rule.hour = config.hour;
var job = schedule.scheduleJob(rule, function() {
    console.log('现在时间', common.formatDateTime(new Date()));
    crawler.downloadImg();
});