const superagent = require('superagent')
require('superagent-proxy')(superagent);
const fs = require('fs')
const cheerio = require('cheerio')
const async = require('async')
const path = require('path')

var headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36",
    "Host": "www.mmjpg.com"
}



superagent
    .get("http://www.mmjpg.com/mm/1306/2")
    .set(headers)
    .set('Referer', 'http://www.mmjpg.com/mm/1306')
    .end((err, res) => {
        if (err) console.log('err')
        var $ = cheerio.load(res.text)
        var link = $('#content a img').attr('src')
        console.log(link)
        getPic(link)
    })

async function getPic(url) {
    superagent
        .get(url)
        .set({ 'Host': 'img.mmjpg.com', 'Upgrade-Insecure-Requests': '1' })
        .set('Referer', 'http://www.mmjpg.com/mm/1306/2')
        .end((err, res) => {
            if (err) {
                console.log(err);

            }
            fs.writeFile('pic.jpg', res.body, (err) => {
                if (err) {
                    console.log(err);
                }
                console.log("下载成功");

            })
        })
}