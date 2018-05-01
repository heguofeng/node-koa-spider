const superagent = require('superagent')
require('superagent-proxy')(superagent);

// 写上你先要测试的 ip，下面仅为测试ip
// let testIp = "http://49.71.90.92:8118";
let arr = ["http://122.114.31.177:808", "http://61.135.217.7:80", "http://218.64.151.224:61234", "http://14.120.180.166:61234", "http://182.88.120.244:8118", "http://117.36.103.170:8118", "http://210.41.107.109:61202", "http://183.159.90.137:18118", "http://117.57.95.11:61234", "http://183.159.88.229:18118", "http://106.122.170.140:8118", "http://124.235.205.63:8118", "http://125.118.42.222:8118", "http://60.177.231.18:18118", "http://113.90.244.135:8118", "http://182.202.220.178:61234", "http://183.159.81.255:18118", "http://49.79.194.0:61234", "http://49.79.192.254:61234", "http://223.241.119.40:18118", "http://60.177.226.147:18118"];


(function(arr) {
    for (i = 0; i < arr.length; i++) {
        let testIp = arr[i];
        superagent.get('http://www.mmjpg.com')
            .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.146 Safari/537.36')
            .set('referer', 'http://www.mmjpg.com')
            .proxy(testIp)
            .timeout(3000)
            .end((err, res) => {
                if (res === undefined) {
                    console.log(testIp + '挂了');
                    return
                }
                if (err) {
                    console.log('报错啦')
                }
                console.log(testIp + '成功： ')

            })

    }

})(arr)