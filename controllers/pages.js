module.exports = {
    'GET /': async(ctx, next) => {
        ctx.render('overview.html', {
            title: ""
        })
    },
    'GET /details': async(ctx, next) => {
        ctx.render('index.html', {})
    }
}