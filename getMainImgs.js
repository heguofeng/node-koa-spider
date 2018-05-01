const superagent = require('superagent')
require('superagent-proxy')(superagent);
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
    // 写上你先要测试的 ip，下面仅为测试ip
var urls = []; //图片地址标题库

function getPic() {
    superagent
        .get('http://www.mmjpg.com/')
        .end((err, res) => {
            if (res === undefined) {
                console.log('挂了');
                return
            }
            if (err) {
                console.log('报错啦')
            }
            // console.log(res.text)
            var $ = cheerio.load(res.text)
            var lis = $(".pic ul li");
            for (let i = 0; i < lis.length; i++) {
                let item = [];
                let link = $(lis).eq(i).children("a").children("img").attr("src");
                let title = $(lis).eq(i).children("a").children("img").attr("alt");
                // 创建文件夹
                if (fs.existsSync(path.join(__dirname, "/pic", title))) {
                    console.log("已存在该文件名,因此不创建")
                } else {
                    fs.mkdir(path.join(__dirname, "/pic", title))
                    console.log("创建文件夹：", title)
                }
                urls.push({ link, title })
            }
            console.log(urls)
            downloadPic(urls); //下载
        })
}

//下载主图
function downloadPic(urls) {
    //循环遍历图片
    for (var ele of urls) {
        const filename = ele.link.split('/').pop(); //取个文件名，最后四位数字.jpg
        let link = ele.link;
        let title = ele.title;
        superagent.get(ele.link).end((err, res) => {
            fs.writeFile("./pic/" + title + "/" + filename, res.body, (err) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(`下载${title}的${link}成功`);
                }
            })
        })
    }
}
getPic()