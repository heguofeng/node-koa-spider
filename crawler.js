const superagent = require('superagent')
    // require('superagent-proxy')(superagent);
const fs = require('fs')
const cheerio = require('cheerio')
const async = require('async')
const path = require('path')
const common = require('./common')
const db = require('./db')
const config = require("./config")

let baseUrl = "http://www.mmjpg.com/";

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
    let webUrlArr = []; //要爬取的整个网站所有的页面合集数组
    let url;
    for (let i = 1; i < 91; i++) {
        if (i == 1) {
            url = "http://www.mmjpg.com/";
            webUrlArr.push(url); //整个网站所有的页面
        } else {
            url = "http://www.mmjpg.com/home/" + i;
            webUrlArr.push(url); //整个网站所有的页面
        }

    };
    //创建pic文件夹，仅运行一次
    if (fs.existsSync(path.join(__dirname, "/static/pic"))) {
        console.log(common.formatDateTime(new Date()) + "<----已存在pic文件夹--->");
        mkMain()
    } else {
        fs.mkdir(path.join(__dirname, "/static/pic"), err => {
            if (err) {
                console.log(err);
            } else {
                console.log(common.formatDateTime(new Date()) + "成功创建pic文件夹");
                mkMain()
            }
        });

    }
    //首次  需要创建主图文件夹用于存放主图
    function mkMain() {
        if (fs.existsSync(path.join(__dirname, "/static/pic/main"))) {
            console.log(common.formatDateTime(new Date()) + "<----已存在主图文件夹--->")
        } else {
            fs.mkdir(path.join(__dirname, "/static/pic/main"), err => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(common.formatDateTime(new Date()) + "成功创建主图文件夹");
                }
            });

        }
    }

    let concurrencyCount = 0; //当前并发数
    //包含每个人的具体信息的数组
    let urlArr = [];
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
                            let item = {};
                            item.mainImg = $(elem).eq(i).children("a").children("img").attr("src"); //主图
                            item.link = $(elem).eq(i).children('a').attr('href'); //主页链接
                            //需要去除标点符号，因为创建文件夹不能有一些特殊符号
                            item.title = $(elem).eq(i).children('.title').text().replace(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g, "");; //标题
                            item.id = $(elem).eq(i).children('a').attr('href').match(/\d{1,}$/)[0]; //获取id，用于拼接ajax(这里用至少一位的数字的正则表达式)
                            item.ajaxUrl = "http://www.mmjpg.com/data.php?id=" + item.id + "&page=8999" //拼接主页所有图片的ajax请求链接
                            item.url = "http://www.mmjpg.com/mm/" + item.id; //id在1255以下的图片不是用ajax拼接的，所以需要直接取访问原网页地址
                            item.visitors = $(elem).eq(i).children(".view").text().match(/\d{1,}/)[0];
                            urlArr.push(item);
                        }
                        setTimeout(() => {
                            concurrencyCount--;
                            callback(null);
                        }, delay);
                    }
                })
        }, config.concurrency);
        q.drain = function() {
            (async function() {
                console.log(common.formatDateTime(new Date()) + "获取结束,这里包含每个人的具体信息的数组", urlArr);
                console.log("开始下载mainPictures");
                await downloadMainPics(urlArr);
                resolve(urlArr);
            })()

        }
        q.push(webUrlArr)
    })
}

//根据图片链接获取每个系列的所有图片src
async function getAllSrcs() {
    console.log(common.formatDateTime(new Date()) + '获取每个系列的所有图片src，开始执行。。。');
    var concurrencyCount = 0; //当前并发数
    var urlArr = await getUrl(); //进行第一步
    let allImgUrls = []; //所有图片的数组
    return new Promise((resolve, reject) => {
        let q = async.queue((urlArr, callback) => {
            var delay = parseInt((Math.random() * 30000000) % 1000 + 500, 10); //设置延时并发爬取
            concurrencyCount++;
            console.log(common.formatDateTime(new Date()) + '现在的并发数是', concurrencyCount, '，正在获取的是', urlArr.title, '延迟', delay, '毫秒')
                //根据id判断是否需要用ajax的拼接 大于1256需要
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
                            var dir = urlArr.id; //文件名为它的id值，独一无二，汉字不利于查找
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

        }, config.concurrency)
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
        //路径  唯一
        var _dir = "/static/pic/" + image.dir + "/" + filename;
        var _imgSrc = image.imgSrc; //图片路径
        var _title = image.title; //标题
        var _imgId = image.id; //人的id
        var _link = image.link; //个人主页链接
        var _visitors = image.visitors; //访问量
        var _filename = filename; //文件名

        let delay = parseInt((Math.random() * 30000000) % 1000 + 1000, 10);
        concurrencyCount++;
        console.log(`现在的并发数是${concurrencyCount}，正在下载${image.dir}的${image.imgSrc}，延迟${delay}mm`);

        if (fs.existsSync(path.join(__dirname, 'static', 'pic', image.dir, filename))) {
            //这里用异步函数等待一下数据库存取
            (async function() {
                console.log(common.formatDateTime(new Date()) + "已存在该文件，就略过咯---->", image.imgSrc, "进行更新访问量操作");
                await db.putVisitors(_dir, _visitors);
                concurrencyCount--;
                callback(null);
            })()
        } else {
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
                                                concurrencyCount--;
                                                callback(null);

                                            }
                                            let endDownload = new Date().getTime();
                                            console.log(common.formatDateTime(new Date()) + filename + "<----下载成功---->", "图片大小为" + (res.headers['content-length'] / 1000) + "KB." + "耗时：" + (endDownload - startDownload) + "mm");
                                            //此处进行数据库存入操作 
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
    }, config.concurrency)

    // 当所有任务都执行完以后，将调用该函数
    q.drain = function() {
        console.log(common.formatDateTime(new Date()) + 'All img download,一共下载了' + downloadCount + "张图片;", "下载失败", errDownloadCount, "张");
        let execTime = new Date().getTime() - startTime;
        console.log("一共耗时" + execTime + 'mm')
    }
    let images = await getAllSrcs();
    q.push(images)
};
//下载主图
async function downloadMainPics(imgs) {
    // console.log(imgs)
    let startTime = new Date().getTime(); //开始时间
    console.log(common.formatDateTime(new Date()) + "开始下载主图主图图片...");
    let errDownloadCount = 0;
    let downloadCount = 0;
    let concurrencyCount = 0;
    return new Promise((resolve, reject) => {
        let q = async.queue(function(image, callback) {
            var _mainImg = image.mainImg;
            var _filename = image.mainImg.split('/').pop();
            var _dir = "/static/pic/main/" + _filename;
            var _title = image.title; //标题
            var _imgId = image.id; //人的id
            var _visitors = image.visitors; //访问量
            var _link = null;
            let delay = parseInt((Math.random() * 30000000) % 1000 + 1000, 10);
            concurrencyCount++;
            console.log(`现在的并发数是${concurrencyCount}，正在下载${_dir}的${_mainImg}，延迟${delay}mm`);
            if (fs.existsSync(path.join(__dirname, "/static/pic/main/", _filename))) {
                //这里用异步函数等待一下数据库存取
                (async function() {
                    console.log(common.formatDateTime(new Date()) + "已存在该文件，就略过咯---->", _mainImg, "进行更新访问量操作");
                    await db.putVisitors(_dir, _visitors);
                    concurrencyCount--;
                    callback(null);
                })()
            } else {
                let startDownload = new Date().getTime();
                return new Promise((resolve, reject) => {
                    try {
                        superagent.get(_mainImg)
                            .set(headers_img)
                            .set('Referer', 'http://www.mmjpg.com/home/8')
                            .timeout(30000)
                            .end((err, res) => {
                                try {
                                    if (err) {
                                        console.log(err);
                                        errDownloadCount += 1;
                                        concurrencyCount -= 1;
                                        callback(null);
                                    } else if (res === undefined) {
                                        console.log(common.formatDateTime(new Date()) + _filename + "---->内容为undefined，下载失败");
                                        errDownloadCount++;
                                        concurrencyCount--;
                                        callback(null)
                                    } else if (res.statusCode == 200) {
                                        if (parseInt(res.headers['content-length']) <= 5000) {
                                            console.log(common.formatDateTime(new Date()) + image._mainImg + "---->该图片太小，取消下载")
                                            concurrencyCount--;
                                            callback(null)
                                        } else {
                                            downloadCount++;
                                            fs.writeFile(path.join(__dirname, "/static/pic/main/", _filename), res.body, (err) => {
                                                if (err) {
                                                    console.log(err);
                                                    concurrencyCount--;
                                                    callback(null);
                                                }
                                                let endDownload = new Date().getTime();
                                                console.log(common.formatDateTime(new Date()) + _filename + "<----下载成功---->", "图片大小为" + (res.headers['content-length'] / 1000) + "KB." + "耗时：" + (endDownload - startDownload) + "mm");
                                                db.postPic(_dir, _mainImg, _title, _imgId, _link, _visitors, _filename);

                                            });
                                            setTimeout(() => {
                                                concurrencyCount--;
                                                callback(null, _filename)
                                            }, delay);
                                        }
                                    }
                                } catch (error) {
                                    console.log(error);
                                    concurrencyCount--;
                                    callback(null)
                                }
                            })
                    } catch (error) {
                        console.log(error);
                        concurrencyCount--;
                        callback(null)
                    }
                })
            }

        }, config.concurrency);
        q.drain = function() {
            console.log(`${common.formatDateTime(new Date())} 所有主图已下载，一共下载了${downloadCount}张,失败：${errDownloadCount}张`);
            resolve();
        }
        q.push(imgs);
    });

}

module.exports = {
    downloadImg: downloadImg
}