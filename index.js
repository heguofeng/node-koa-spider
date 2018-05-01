const superagent = require('superagent')
require('superagent-proxy')(superagent);
const fs = require('fs')
const cheerio = require('cheerio')
const async = require('async')
const path = require('path')

let baseUrl = "http://www.mmjpg.com/";
let urlArr = []; //包含每个人的具体信息的数组
let proxy = "http://61.135.217.7:80";
var headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36",
    "Host": "www.mmjpg.com"
}





//一开始获取每个人的具体信息
async function getUrl() {
    console.log("获取所有的home页面集合");
    let webUrlArr = [];
    let url;
    for (let i = 1; i < 20; i++) {
        if (i == 1) {
            url = "http://www.mmjpg.com/";
            webUrlArr.push(url); //整个网站所有的页面
        } else {
            url = "http://www.mmjpg.com/home/" + i;
            webUrlArr.push(url); //整个网站所有的页面
        }

    }
    let concurrencyCount = 0;
    return new Promise((resolve, reject) => {
        let q = async.queue((webUrl, callback) => {
            // console.log("开始获取每个home页面每个人的具体信息")
            var delay = parseInt((Math.random() * 30000000) % 1000 + 1000, 10); //设置延时并发爬取
            concurrencyCount++;
            console.log('现在的并发数是', concurrencyCount, '，正在获取的是', webUrl, '延迟', delay, '毫秒')
            superagent.get(webUrl)
                .set(headers)
                .set("Referer", "http://www.mmjpg.com/home/11")
                // .proxy(proxy)
                .end((err, res) => {
                    if (err) {
                        console.log('访问页面出错啦' + webUrl)
                        console.log(err);

                        concurrencyCount--;
                        callback(null)
                    } else if (res === undefined) {
                        concurrencyCount--;
                        callback(null)
                        return
                    } else if (res.statusCode == 200) {
                        console.log("访问成功", webUrl)
                        var $ = cheerio.load(res.text);
                        var elem = $('.main .pic ul li')
                        for (let i = 0; i < elem.length; i++) {
                            let item = {}
                            item.link = $(elem).eq(i).children('a').attr('href'); //主页链接
                            //需要去除标点符号，因为创建文件夹不能有一些符号
                            item.title = $(elem).eq(i).children('.title').text().replace(/[\ |\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g, "");; //标题
                            item.id = $(elem).eq(i).children('a').attr('href').match(/\d{1,}$/)[0]; //获取id，用于拼接ajax(这里用至少一位的数字)
                            item.ajaxUrl = "http://www.mmjpg.com/data.php?id=" + item.id + "&page=8999" //拼接主页所有图片的ajax请求链接
                            item.url = "http://www.mmjpg.com/mm/" + item.id; //id在1255以下的图片不是用ajax拼接的，所以直接取访问原网页地址
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
            console.log("获取结束,这里包含每个人的具体信息的数组", urlArr)
            resolve(urlArr)
        }
        q.push(webUrlArr)
    })
}

//根据图片链接获取每个系列的所有图片src
async function getAllSrcs() {
    console.log('获取每个系列的所有图片src，开始执行。。。')
    var concurrencyCount = 0;
    var urlArr = await getUrl(); //进行第一步
    let allImgUrls = [];
    return new Promise((resolve, reject) => {
        let q = async.queue((urlArr, callback) => {
            var delay = parseInt((Math.random() * 30000000) % 1000 + 1000, 10); //设置延时并发爬取
            concurrencyCount++;
            console.log('现在的并发数是', concurrencyCount, '，正在获取的是', urlArr.title, '延迟', delay, '毫秒')
                //判断是否需要用ajax的拼接
            if (urlArr.id >= 1256) {
                superagent
                    .get(urlArr.ajaxUrl)
                    .set(headers)
                    .set('Referer', 'http://www.mmjpg.com/mm/' + urlArr.id)
                    // .proxy(proxy)
                    .end((err, res) => {
                        if (err) {
                            console.log(err)
                            callback(null)
                        } else if (res === undefined) {
                            concurrencyCount--;
                            callback(null)
                        } else if (res.statusCode == 200) {
                            var dir = urlArr.title;
                            if (fs.existsSync(path.join(__dirname, '/pic', dir))) {
                                console.log("已存在该文件名")
                            } else {
                                fs.mkdir(path.join(__dirname, '/pic', dir))
                                console.log(`成功创建文件夹 ${dir}`)
                            }

                            var arr = res.text.split(","); //获取后缀
                            const pageCount = arr.length; //总页面

                            console.log(`${dir}文件夹下共有图片: `, pageCount, "张")
                            for (let i = 0; i < pageCount; i++) {
                                // "http://img.mmjpg.com/2018/1300/1i0d.jpg"  格式
                                var j = i + 1;
                                let item = {}
                                item.imgSrc = "http://img.mmjpg.com/2018/" + urlArr.id + "/" + j + "i" + arr[i] + '.jpg';
                                item.title = dir;
                                item.id = urlArr.id;

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
                            callback(null)
                        } else if (res === undefined) {
                            concurrencyCount--;
                            callback(null)
                        } else if (res.statusCode == 200) {
                            var dir = urlArr.title;
                            if (fs.existsSync(path.join(__dirname, '/pic', dir))) {
                                console.log("已存在该文件名")
                            } else {
                                fs.mkdir(path.join(__dirname, '/pic', dir))
                                console.log(`成功创建文件夹 ${dir}`)
                            }

                            var $ = cheerio.load(res.text);
                            let pageCount = parseInt($('.main #page #opic').prev().text().trim());
                            for (let i = 1; i <= pageCount; i++) {
                                let item = {}
                                item.imgSrc = "http://img.mmjpg.com/2018/" + urlArr.id + "/" + i + '.jpg';
                                item.title = dir;
                                item.id = urlArr.id;

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
            console.log("获取了每个人的所有图片地址 已完成")
            resolve(allImgUrls)
            console.log(allImgUrls)
        }
        q.push(urlArr)
    })
}

let downloadImg = async function() {
    console.log("开始下载图片...");
    let errDownloadCount = 0;
    let downloadCount = 0;
    let concurrencyCount = 0;
    let q = async.queue(function(image, callback) {
        const filename = image.imgSrc.split('/').pop()
        if (fs.existsSync(path.join(__dirname, 'pic', image.title, filename))) {
            console.log("已存在该文件，略过")
            callback(null);
        } else {
            let delay = parseInt((Math.random() * 30000000) % 1000 + 1000, 10);
            concurrencyCount++;
            console.log(`现在的并发数是${concurrencyCount}，正在下载${image.title}的${filename}，延迟${delay}mm`);
            return new Promise((resolve, reject) => {
                try {
                    superagent.get(image.imgSrc)
                        .set({ 'Host': 'img.mmjpg.com', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36' })
                        .set('Referer', 'http://www.mmjpg.com/mm/' + image.id)
                        .end((err, res) => {
                            try {
                                if (err) {
                                    console.log(filename + "下载失败");
                                    errDownloadCount++;
                                    // console.log(err);
                                    concurrencyCount--;
                                    callback(null)
                                } else if (res === undefined) {
                                    console.log(filename + "下载失败");
                                    errDownloadCount++;
                                    concurrencyCount--;
                                    callback(null)
                                } else if (res.statusCode == 200) {
                                    downloadCount++;
                                    // res.body.pipe(fs.createWriteStream(path.join(__dirname, 'pic', dir, filename)))
                                    fs.writeFile(path.join(__dirname, 'pic', image.title, filename), res.body, (err) => {
                                        if (err) {
                                            console.log(err);
                                            callback(null)
                                        }
                                        console.log(filename + "下载成功");

                                    });
                                    setTimeout(() => {
                                        concurrencyCount--;
                                        callback(null, filename)
                                    }, delay);
                                }
                            } catch (error) {
                                console("里面哪里出错啦", error);
                                concurrencyCount--;
                                callback(null, filename)
                            }

                        });
                } catch (error) {
                    console("哪里出错啦", error);
                    concurrencyCount--;
                    callback(null, filename)
                }

            });
        }
    }, 5)

    // 当所有任务都执行完以后，将调用该函数
    q.drain = function() {
        console.log('All img download,一共下载了' + downloadCount + "张图片;", "下载失败", errDownloadCount, "张");
    }
    let images = await getAllSrcs();
    q.push(images)
}


downloadImg()