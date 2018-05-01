const superagent = require('superagent')
require('superagent-proxy')(superagent);
const cheerio = require('cheerio')
const fs = require('fs')
const apiFunc = require('./apiFunc') // 封装的一些读写api
const eventproxy = require('eventproxy') //控制流程
const ep = new eventproxy()
const async = require('async')


// 爬取代理的 ip
const url = 'http://www.xicidaili.com/nn'
    // let url = website + '/dailiip/1/'
var proxys = []; //保存从网站上获取到的代理
var useful = []; //保存检查过有效性的代理

// app.get('/', function(req, res, next) {
// res.setHeader('Content-Type', 'text/html; charset=utf-8');

(function(url) {
    superagent
        .get(url)
        // .proxy('117.68.193.244')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36')
        .set('referer', 'http://www.xicidaili.com/')
        .end((err, res) => {
            if (err) {
                console.log("发生错误")
            }
            var $ = cheerio.load(res.text)
            var trs = $('#ip_list tr');
            for (let i = 1; i < trs.length; i++) {
                tr = trs.eq(i)
                tds = tr.children("td")
                var proxy = "http://" + tds.eq(1).text() + ":" + tds.eq(2).text() //组装成完整ip地址
                var speed = tds.eq(6).children("div").attr('title')
                speed = speed.substring(0, speed.length - 1) //删除最后一个“秒”字
                var connectTime = tds.eq(7).children('div').attr('title')
                connectTime = connectTime.substring(0, connectTime.length - 1) //删除最后一个“秒”字
                if (speed <= 5 && connectTime <= 1) {
                    // console.log(proxy)
                    proxys.push(proxy)
                }
            }
            console.log(proxys)
            ep.emit('get_ipp', proxys)
        })
})(url)

ep.after('get_ipp', 1, function() {
    var concurrencyCount = 0;
    var num = -4;

    // 过滤掉无用的 ip
    var filterIp = function(proxy, callback) {
            var fetchStart = new Date().getTime();
            concurrencyCount++;
            num += 1;
            console.log('现在的并发数是', concurrencyCount, '，正在测试的IP是', proxy)
            superagent
                .get('http://www.mmjpg.com/')
                .proxy(proxy)
                .timeout(3000)
                .end((err, res) => {
                    if (err) {
                        concurrencyCount--;
                        callback(null);
                        return console.log("测试", proxy, "发生错误")
                    } else if (res === undefined) {
                        concurrencyCount--;
                        callback(null);
                        return;
                    } else {
                        var time = new Date().getTime() - fetchStart;
                        console.log('测试 ' + proxy + ' 成功', '，耗时' + time + '毫秒');
                        concurrencyCount--;
                        useful.push(proxy);
                        callback(null, proxy)
                    }

                })
        }
        //如果callback返回5个err，就直接跳到最后的callback的err
    async.mapLimit(proxys, 5, function(proxy, callback) {
        filterIp(proxy, callback);
    }, async function(err, results) {
        // console.log("results是,", results)
        console.log("有效的ip是", useful)
            //爬虫结束，做统计
        if (err) {
            console.log("错满5条啦", err)
        }
        await fs.writeFile("ips.json", JSON.stringify(useful), function(err) {
            if (err) {
                console.log("写入出错")
            }
            console.log("全部数据写入完成")
        })
        console.log('抓包结束，一共抓取了--》》' + proxys.length + "条IP")
        console.log('有效ip--》》' + useful.length + "条")
            // console.log(useful)
        return false;
    })
})