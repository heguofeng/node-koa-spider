const db = require('../db')
const APIError = require('../rest').APIError;
const webhttp = require('../webhttp')
    //鹰眼数据
const ak = "5fttGK4f4cwt6MCIZLG6SQgz0TVwGyIj";
const service_id = 164254;


module.exports = {
    'GET /api/openId': async(ctx, next) => {
        // console.log(ctx.request.query)
        let code = ctx.request.query.code;
        let appid = 'wx57027f0fdfe2f141';
        let secret = 'b7e4eee0aed838ff73c091c67552d6f0';
        let data = await webhttp.httpGet(`https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`);
        console.log(data)
        ctx.rest({
            data: data
        })
    },
    //新建一人
    "POST /api/man": async(ctx, next) => {
        let data = await db.postMan(
            ctx.request.body.username,
            ctx.request.body.avatarUrl
        );
        ctx.rest({
            data: JSON.stringify(data)
        })
    },
    //获取所有位置信息
    "GET /api/locations": async(ctx, next) => {
        let data = await db.getLocations();
        ctx.rest({
            data: data
        })
    },
    //获取线上人们的位置
    "GET /api/locations/onlineStatus": async(ctx, next) => {
        let data = await db.getOnlineLocations();
        ctx.rest({
            data: data
        })
    },
    //在鹰眼上创建一个entity
    "POST /api/yingyan/entity/add": async(ctx, next) => {
        let entity_name = ctx.request.body.entity_name;
        let entity_desc = ctx.request.body.entity_desc;
        let postDoc = `ak=${ak}&service_id=${service_id}&entity_name=${entity_name}&entity_desc=${entity_desc}`
        let data = await webhttp.httpPost('http://yingyan.baidu.com/api/v3/entity/add', postDoc);
        console.log("百度返回结果", data)
        if (JSON.parse(data).status == 0) {
            ctx.rest({
                data: data
            })
        } else {
            console.log("鹰眼创建entity失败！")
            ctx.rest({
                data: data
            })
        }

    }
}