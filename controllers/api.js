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

        let data = await db.postPic(
            ctx.request.body.username,
            ctx.request.body.avatarUrl

        );
        ctx.rest({
            data: JSON.stringify(data)
        })
    },

}