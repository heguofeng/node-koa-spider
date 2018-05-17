module.exports = {
    'GET /': async(ctx, next) => {
        ctx.render('index.html', {
            title: ""
        })
    },
    'GET /details/:id': async(ctx, next) => {
        //图片人物的id
        let id = ctx.params.id;
        // console.log(id)
        ctx.render('details.html', {
            id: id
        })
    }
}