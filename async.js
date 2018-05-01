const superagent = require('superagent')
require('superagent-proxy')(superagent);
const cheerio = require('cheerio')
const fs = require('fs')
const path = require('path')
const async = require('async')
const proxy = "http://61.135.217.7:80";

var headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36",
        "Host": "www.mmjpg.com"
    }
    // 写上你先要测试的 ip，下面仅为测试ip
var urls = []; //图片地址标题库
var arrAjax = []; //ajax api数组
var imgSrcs = []; //api里的图片链接数组
function getcount() {
    superagent.get("http://www.mmjpg.com/mm/1248")
        .set({ 'Host': 'www.mmjpg.com', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36' })
        .set("Referer", "http://www.mmjpg.com/home/16")
        .end((err, res) => {
            if (err) {
                console.log(err)

            } else if (res === undefined) {
                return
            } else if (res.statusCode == 200) {

                var $ = cheerio.load(res.text);
                let pageCount = parseInt($('.main #page #opic').prev().text().trim());
                for (i = 0; i <= pageCount; i++) {
                    console.log(i)
                }

            }

        })
}
getcount()