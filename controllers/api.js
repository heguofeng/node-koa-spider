const db = require('../db')
const APIError = require('../rest').APIError;

module.exports = {
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
    //获取普通顺序图片
    "GET /api/pics": async(ctx, next) => {
        let page = ctx.request.query.page;

        let data = await db.getPics(page);
        ctx.rest({
            data: JSON.stringify(data)
        })
    },
    //排行榜
    "GET /api/tops": async(ctx, next) => {
        let page = ctx.request.query.page;
        let data = await db.getTops(page);
        ctx.rest({
            data: JSON.stringify(data)
        })
    },
    //随机查询
    "GET /api/random": async(ctx, next) => {
        let data = await db.getRandom();
        // console.log(data)
        ctx.rest({
            data: JSON.stringify(data)
        })
    },
    "GET /api/details/:imgId": async(ctx, next) => {
        let imgId = ctx.params.imgId;
        console.log(imgId)
        let data = await db.getDetailsByImgId(imgId);
        ctx.rest({
            data: JSON.stringify(data)
        })
    }
}