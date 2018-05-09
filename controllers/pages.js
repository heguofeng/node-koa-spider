module.exports = {
    'GET /': async(ctx, next) => {
        ctx.render('index.html', {
            title: "40周年地图"
        })
    }
}