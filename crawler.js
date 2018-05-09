const superagent = require('superagent')
require('superagent-proxy')(superagent);
const fs = require('fs')
const cheerio = require('cheerio')
const async = require('async')
const path = require('path')
const common = require('./common')
const db = require('./db')

let baseUrl = "http://www.mmjpg.com/";
let urlArr = []; //包含每个人的具体信息的数组
let proxy = "http://61.135.217.7:80";
var headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "zh-CN,zh;q=0.9",
    'Connection': 'keep-alive',
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36",
    "Host": "www.mmjpg.com"
}
var headers_img = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate",
    "Accept-Language": "zh-CN,zh;q=0.9",
    'Connection': 'keep-alive',
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36",
    "Host": "img.mmjpg.com"
};
//一开始获取每个人的具体信息
async function getUrl() {
    console.log(common.formatDateTime(new Date()) + "获取所有的home页面集合");
    let webUrlArr = [];
    let url;
    for (let i = 1; i < 90; i++) {
        if (i == 1) {
            url = "http://www.mmjpg.com/";
            webUrlArr.push(url); //整个网站所有的页面
        } else {
            url = "http://www.mmjpg.com/home/" + i;
            webUrlArr.push(url); //整个网站所有的页面
        }

    }
    let concurrencyCount = 0;
    urlArr = []; //清空一次数据
    return new Promise((resolve, reject) => {
        let q = async.queue((webUrl, callback) => {
            // console.log("开始获取每个home页面每个人的具体信息")
            var delay = parseInt((Math.random() * 30000000) % 1000 + 200, 10); //设置延时并发爬取
            concurrencyCount++;
            console.log(common.formatDateTime(new Date()) + '现在的并发数是', concurrencyCount, '，正在获取的是', webUrl, '延迟', delay, '毫秒')
            superagent.get(webUrl)
                .set(headers)
                .set("Referer", "http://www.mmjpg.com/home/12")
                // .proxy(proxy)
                .end((err, res) => {
                    if (err) {
                        console.log(common.formatDateTime(new Date()) + '访问页面出错啦' + webUrl)
                        console.log(err);
                        concurrencyCount--;
                        callback(null)
                    } else if (res === undefined) {
                        concurrencyCount--;
                        callback(null)
                        return
                    } else if (res.statusCode == 200) {
                        console.log(common.formatDateTime(new Date()) + "访问成功", webUrl)
                        var $ = cheerio.load(res.text);
                        var elem = $('.main .pic ul li')
                        for (let i = 0; i < elem.length; i++) {
                            let item = {}
                            item.link = $(elem).eq(i).children('a').attr('href'); //主页链接
                            //需要去除标点符号，因为创建文件夹不能有一些符号
                            item.title = $(elem).eq(i).children('.title').text().replace(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g, "");; //标题
                            item.id = $(elem).eq(i).children('a').attr('href').match(/\d{1,}$/)[0]; //获取id，用于拼接ajax(这里用至少一位的数字的正则表达式)
                            item.ajaxUrl = "http://www.mmjpg.com/data.php?id=" + item.id + "&page=8999" //拼接主页所有图片的ajax请求链接
                            item.url = "http://www.mmjpg.com/mm/" + item.id; //id在1255以下的图片不是用ajax拼接的，所以直接取访问原网页地址
                            item.visitors = $(elem).eq(i).children(".view").text().match(/\d{1,}/)[0];
                            urlArr.push(item)
                        }
                        setTimeout(() => {
                            concurrencyCount--;
                            callback(null);
                        }, delay);
                    }
                })
        }, 5);
        q.drain = function() {
            console.log(common.formatDateTime(new Date()) + "获取结束,这里包含每个人的具体信息的数组", urlArr)
            resolve(urlArr)
        }
        q.push(webUrlArr)
    })
}

//根据图片链接获取每个系列的所有图片src
async function getAllSrcs() {
    console.log(common.formatDateTime(new Date()) + '获取每个系列的所有图片src，开始执行。。。')
    var concurrencyCount = 0;
    var urlArr = await getUrl(); //进行第一步
    let allImgUrls = [];
    return new Promise((resolve, reject) => {
        let q = async.queue((urlArr, callback) => {
            var delay = parseInt((Math.random() * 30000000) % 1000 + 500, 10); //设置延时并发爬取
            concurrencyCount++;
            console.log(common.formatDateTime(new Date()) + '现在的并发数是', concurrencyCount, '，正在获取的是', urlArr.title, '延迟', delay, '毫秒')
                //判断是否需要用ajax的拼接
            if (urlArr.id >= 1256) {
                superagent
                    .get(urlArr.ajaxUrl)
                    .set(headers)
                    .set('Referer', 'http://www.mmjpg.com/mm/' + urlArr.id)
                    // .proxy(proxy)
                    .end((err, res) => {
                        if (err) {
                            console.log(err);
                            concurrencyCount--;
                            callback(null)
                        } else if (res === undefined) {
                            concurrencyCount--;
                            callback(null)
                        } else if (res.statusCode == 200) {
                            // var dir = urlArr.title;
                            var dir = urlArr.id;
                            if (fs.existsSync(path.join(__dirname, '/static/pic', dir))) {
                                console.log(common.formatDateTime(new Date()) + "已存在该文件名")
                            } else {
                                fs.mkdir(path.join(__dirname, '/static/pic', dir))
                                console.log(common.formatDateTime(new Date()) + `成功创建文件夹 ${dir}`)
                            }

                            var arr = res.text.split(","); //获取后缀
                            const pageCount = arr.length; //总页面

                            console.log(`${dir}文件夹下共有图片: `, pageCount, "张")
                            for (let i = 0; i < pageCount; i++) {
                                // "http://img.mmjpg.com/2018/1300/1i0d.jpg"  格式
                                var j = i + 1;
                                let item = {}
                                item.imgSrc = "http://img.mmjpg.com/2018/" + urlArr.id + "/" + j + "i" + arr[i] + '.jpg';
                                item.dir = dir;
                                item.id = urlArr.id;
                                item.link = urlArr.link;
                                item.title = urlArr.title;
                                item.visitors = urlArr.visitors;
                                allImgUrls.push(item)
                            }
                            setTimeout(() => {
                                concurrencyCount--;
                                callback(null);
                            }, delay);
                        }
                    })
            } else {
                superagent.get(urlArr.url)
                    .set(headers)
                    .set("Referer", "http://www.mmjpg.com/home/11")
                    .end((err, res) => {
                        if (err) {
                            console.log(err)
                            concurrencyCount--;
                            callback(null);
                        } else if (res === undefined) {
                            concurrencyCount--;
                            callback(null);
                        } else if (res.statusCode == 200) {
                            // var dir = urlArr.title;
                            var dir = urlArr.id;
                            if (fs.existsSync(path.join(__dirname, '/static/pic', dir))) {
                                console.log(common.formatDateTime(new Date()) + "<----已存在该文件名--->" + dir)
                            } else {
                                fs.mkdir(path.join(__dirname, '/static/pic', dir))
                                console.log(common.formatDateTime(new Date()) + `<----成功创建文件夹----> ${dir}`)
                            }

                            var $ = cheerio.load(res.text);
                            let pageCount = parseInt($('.main #page #opic').prev().text().trim());
                            let _imgSrc = $("#content a img").attr("src").match(/^http\:\/\/img\.mmjpg\.com\/\d{4}\//); //前缀
                            for (let i = 1; i <= pageCount; i++) {
                                let item = {}
                                item.imgSrc = _imgSrc + urlArr.id + "/" + i + '.jpg';
                                item.dir = dir;
                                item.id = urlArr.id;
                                item.link = urlArr.link;
                                item.title = urlArr.title;
                                item.visitors = urlArr.visitors;
                                allImgUrls.push(item)
                            }
                            setTimeout(() => {
                                concurrencyCount--;
                                callback(null);
                            }, delay);
                        }

                    })
            }

        }, 5)
        q.drain = function() {
            console.log(common.formatDateTime(new Date()) + "获取了每个人的所有图片地址 已完成")
            resolve(allImgUrls)
            console.log(allImgUrls)
        }
        q.push(urlArr)
    })
}

let downloadImg = async function() {
    let startTime = new Date().getTime(); //开始时间
    console.log(common.formatDateTime(new Date()) + "开始下载图片...");
    let errDownloadCount = 0;
    let downloadCount = 0;
    let concurrencyCount = 0;
    let q = async.queue(function(image, callback) {
        const filename = image.imgSrc.split('/').pop();
        if (fs.existsSync(path.join(__dirname, 'static', 'pic', image.dir, filename))) {
            console.log("已存在该文件，略过---->", image.imgSrc);
            // concurrencyCount--; //这里还未开始计算，就取消减
            callback(null);
        } else {
            let delay = parseInt((Math.random() * 30000000) % 1000 + 1000, 10);
            concurrencyCount++;
            console.log(`现在的并发数是${concurrencyCount}，正在下载${image.dir}的${image.imgSrc}，延迟${delay}mm`);
            let startDownload = new Date().getTime();
            return new Promise((resolve, reject) => {
                try {
                    superagent.get(image.imgSrc)
                        .set(headers_img)
                        .set('Referer', 'http://www.mmjpg.com/mm/' + image.id)
                        .timeout(30000)
                        .end((err, res) => {
                            try {
                                if (err) {
                                    console.log(common.formatDateTime(new Date()) + image.imgSrc + "---->下载失败");
                                    errDownloadCount++;
                                    concurrencyCount--;
                                    callback(null)
                                } else if (res === undefined) {
                                    console.log(common.formatDateTime(new Date()) + filename + "---->内容为undefined，下载失败");
                                    errDownloadCount++;
                                    concurrencyCount--;
                                    callback(null)
                                } else if (res.statusCode == 200) {
                                    if (parseInt(res.headers['content-length']) <= 20000) { //如果图片太小，直接取消下载
                                        console.log(common.formatDateTime(new Date()) + image.imgSrc + "---->该图片太小，取消下载")
                                        concurrencyCount--;
                                        callback(null)
                                    } else {
                                        downloadCount++;
                                        fs.writeFile(path.join(__dirname, 'static', 'pic', image.dir, filename), res.body, (err) => {
                                            if (err) {
                                                console.log(err);
                                                callback(null)
                                            }
                                            let endDownload = new Date().getTime();
                                            console.log(common.formatDateTime(new Date()) + filename + "<----下载成功---->", "图片大小为" + (res.headers['content-length'] / 1000) + "KB." + "耗时：" + (endDownload - startDownload) + "mm");
                                            //此处进行数据库存入操作 
                                            //路径
                                            var _dir = "/static/pic/" + image.dir + "/" + filename;
                                            var _imgSrc = image.imgSrc; //图片路径
                                            var _title = image.title; //标题
                                            var _imgId = image.id; //id
                                            var _link = image.link; //个人主页链接
                                            var _visitors = image.visitors; //访问量
                                            var _filename = filename;
                                            db.postPic(_dir, _imgSrc, _title, _imgId, _link, _visitors, _filename);
                                        });
                                        setTimeout(() => {
                                            concurrencyCount--;
                                            callback(null, filename)
                                        }, delay);
                                    }
                                }
                            } catch (error) {
                                console.log(common.formatDateTime(new Date()) + "里面哪里出错啦", error);
                                concurrencyCount--;
                                callback(null, filename)
                            }

                        });
                } catch (error) {
                    console.log(common.formatDateTime(new Date()) + "哪里出错啦", error);
                    concurrencyCount--;
                    callback(null, filename)
                }

            });
        }
    }, 5)

    // 当所有任务都执行完以后，将调用该函数
    q.drain = function() {
        console.log(common.formatDateTime(new Date()) + 'All img download,一共下载了' + downloadCount + "张图片;", "下载失败", errDownloadCount, "张");
        let execTime = new Date().getTime() - startTime;
        console.log("一共耗时" + execTime + 'mm')
    }
    let images = await getAllSrcs();
    q.push(images)
}

module.exports = {
    downloadImg: downloadImg
}