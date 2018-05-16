var fontSize;
let toggleFlag = false; //单双列
let mode; //模式 random normal tops
var loading = true; //下拉刷新加载状态
var page = 0; //页数

initpage();
$(".item img").css("width", '1.845rem'); //初始化二列
$.showLoading();
var box = document.getElementById('container');

window.onload = function() {
    $("#getRandom").addClass("toggle_now");
    $("#getRandom").removeClass("toggle");
    if (parseInt(localStorage.getItem("page")) > 0 && localStorage.getItem("mode") != "random") {
        $.confirm({
            title: "跳一跳",
            text: "是否跳转至上次观看的地方",
            onOK: function() {
                mode = localStorage.getItem("mode");
                page = parseInt(localStorage.getItem("page"));
                if (mode == "tops") {
                    getTops(page - 1);
                    $("#getTops").addClass("toggle_now");
                    $("#getTops").removeClass("toggle");
                } else if (mode == "normal") {
                    getNormal(page - 1);
                    $("#getNormal").addClass("toggle_now");
                    $("#getNormal").removeClass("toggle");
                }
            },
            onCancel: function() {
                page = 0;
                getRandom();
                localStorage.setItem("page", 0);
            }
        });
    } else {
        page = 0;
        getRandom();
        // getNormal(page)
    }

    // 当加载到第最后一张的时候 
    $(document.body).infinite(150).on("infinite", function() {
        if (loading) return;
        loading = true;
        page = parseInt(localStorage.getItem("page"));
        console.log(page)
        if (mode == "normal") {
            getNormal(page);
        } else if (mode == "tops") {
            getTops(page);
        } else if (mode == "random") {
            console.log("加载随机")
            getRandom()
        }

    });
};
// 页面尺寸改变时实时触发 
window.onresize = function() {
    initpage();
    waterFall();
};
let sTop = 0;
let sTop2 = 0;
$(window).scroll(function() {
    sTop = $(this).scrollTop();
    if (sTop > sTop2) {
        $("#toolbar").slideUp("slow");
    } else {
        $("#toolbar").slideDown("slow");
    }
    setTimeout(() => {
        sTop2 = sTop;
    }, 0);
});
//单双列
$("#toggleList").click(function() {
    if (toggleFlag == false) {
        $(".item img").css("width", '3.75rem');
        $(".item img").css("height", '5.625rem');
        $(".item").width(375 / 100 * fontSize);
        $(".text").width(375 / 100 * fontSize);
        $("#toggleList").text("双列");
        toggleFlag = true;
    } else {
        $(".item img").css("width", '1.7rem');
        $(".item img").css("height", '2.55rem');
        $(".item").width(170 / 100 * fontSize);
        $(".text").width(170 / 100 * fontSize);
        $("#toggleList").text("单列");
        toggleFlag = false;
    }

});

//切换模式
$("#toolbar").on("click", ".mode", function() {
    $.showLoading();
    localStorage.setItem("page", 0);
    page = parseInt(localStorage.getItem("page"));
    $("#container").empty();
    $(".mode").addClass("toggle");
    $(".mode").removeClass("toggle_now");
    $(this).addClass("toggle_now");
    $(this).removeClass("toggle");
    console.log($(this).attr("id"))
    let nodeId = $(this).attr("id");
    if (nodeId == "getTops") {
        getTops(page);
    } else if (nodeId == "getNormal") {
        getNormal(page);
    } else if (nodeId == "getRandom") {
        getRandom();
    }
});

function getRandom() {
    mode = "random";
    localStorage.setItem("mode", mode);
    $.ajax({
        url: "/api/random",
        type: "get",
        dataType: "json",
        success: res => {
            loading = true;
            let data = JSON.parse(res.data);
            // console.log(data)
            let pics = []; //新的图片库
            for (let i in data) {
                let pic = {};
                pic._dir = data[i][0]._dir; //数据格式问题，这里是二维数组
                pic._title = data[i][0]._title;
                pic._imgId = data[i][0]._imgId;
                pics.push(pic);
            }
            let PromiseALl = []; //所有异步操作
            let imgs = []; //新的图片集合
            for (let i in pics) {
                PromiseALl[i] = new Promise((resolve, reject) => {
                    imgs[i] = new Image();
                    imgs[i].src = pics[i]._dir;
                    imgs[i].alt = pics[i]._title;
                    imgs[i].setAttribute("data-imgId", pics[i]._imgId);
                    imgs[i].className = "mmImg";
                    if (toggleFlag) {
                        imgs[i].width = 375 / 100 * fontSize;
                        $(".text").width(375 / 100 * fontSize)
                    } else {
                        imgs[i].width = 170 / 100 * fontSize;
                        $(".text").width(170 / 100 * fontSize)
                    }
                    imgs[i].onload = function() {
                        $.hideLoading();
                        let div = document.createElement("div");
                        div.className = "item";
                        div.append(imgs[i]);
                        $(div).append("<div class='text'><p class='title'>" + pics[i]._title + "</p></div>");
                        if (toggleFlag) {
                            $(".item").width(375 / 100 * fontSize);
                            $(".text").width(375 / 100 * fontSize);
                        } else {
                            $(".item").width(170 / 100 * fontSize);
                            $(".text").width(170 / 100 * fontSize);
                        }
                        $(div).wrapInner(`<a href="./details/${pics[i]._imgId}"></a>`);
                        box.append(div);
                        resolve();

                    }
                });
            }
            Promise.all(PromiseALl).then(() => {
                if (toggleFlag) {
                    $(".item").width(375 / 100 * fontSize);
                    $(".text").width(375 / 100 * fontSize);
                } else {
                    $(".item").width(170 / 100 * fontSize);
                    $(".text").width(170 / 100 * fontSize);
                }

                loading = false;
            }).catch((reason) => {
                console.log(reason)
            });
        },
        error: err => {
            console.log(err);
        }
    })
}

function getTops(page) {
    mode = "tops";
    localStorage.setItem("mode", mode);
    $.ajax({
        url: "/api/tops",
        type: "get",
        data: {
            "page": page
        },
        dataType: "json",
        success: res => {
            page += 1;
            localStorage.setItem("page", page);
            let data = JSON.parse(res.data);
            console.log(data.length);
            let pics = []; //新的图片库
            for (let i in data) {
                let pic = {};
                pic._dir = data[i]._dir;
                pic._title = data[i]._title;
                pic._imgId = data[i]._imgId;
                pics.push(pic);
            }
            let PromiseALl = []; //所有异步操作
            let imgs = []; //新的图片集合
            for (let i in pics) {
                PromiseALl[i] = new Promise((resolve, reject) => {
                    imgs[i] = new Image();
                    imgs[i].src = pics[i]._dir;
                    imgs[i].alt = pics[i]._title;
                    imgs[i].setAttribute("data-imgId", pics[i]._imgId);
                    imgs[i].className = "mmImg";
                    if (toggleFlag) {
                        imgs[i].width = 375 / 100 * fontSize;
                        $(".text").width(375 / 100 * fontSize)
                    } else {
                        imgs[i].width = 170 / 100 * fontSize;
                        $(".text").width(170 / 100 * fontSize)
                    }
                    imgs[i].onload = function() {

                        $.hideLoading();

                        let div = document.createElement("div");
                        div.className = "item";
                        div.append(imgs[i]);
                        $(div).append("<div class='text'><p class='title'>" + pics[i]._title + "</p></div>");
                        if (toggleFlag) {
                            $(".item").width(375 / 100 * fontSize);
                            $(".text").width(375 / 100 * fontSize);
                        } else {
                            $(".item").width(170 / 100 * fontSize);
                            $(".text").width(170 / 100 * fontSize);
                        }
                        $(div).wrapInner(`<a href="./details/${pics[i]._imgId}"></a>`);
                        box.append(div);
                        resolve();

                    }
                });
            }
            Promise.all(PromiseALl).then(() => {
                if (toggleFlag) {
                    $(".item").width(375 / 100 * fontSize);
                    $(".text").width(375 / 100 * fontSize);
                } else {
                    $(".item").width(170 / 100 * fontSize);
                    $(".text").width(170 / 100 * fontSize);
                }

                loading = false;
            }).catch((reason) => {
                console.log(reason)
            });
        },
        error: err => {
            console.log(err)
        }
    });
}
//加载普通图片
function getNormal(page) {
    // console.log(page)
    mode = "normal";
    localStorage.setItem("mode", mode);
    $.ajax({
        url: "/api/pics",
        type: "get",
        data: {
            "page": page
        },
        dataType: "json",
        success: res => {
            page += 1;
            localStorage.setItem("page", page);
            let data = JSON.parse(res.data);
            console.log(data.length);
            let pics = []; //新的图片库
            for (let i in data) {
                let pic = {};
                pic._dir = data[i]._dir;
                pic._title = data[i]._title;
                pic._imgId = data[i]._imgId;
                pics.push(pic);
            }
            let PromiseALl = []; //所有异步操作
            let imgs = []; //新的图片集合
            for (let i in pics) {
                PromiseALl[i] = new Promise((resolve, reject) => {
                    imgs[i] = new Image();
                    imgs[i].src = pics[i]._dir;
                    imgs[i].alt = pics[i]._title;
                    imgs[i].setAttribute("data-imgId", pics[i]._imgId);
                    imgs[i].className = "mmImg";
                    if (toggleFlag) {
                        imgs[i].width = 375 / 100 * fontSize;
                        $(".text").width(375 / 100 * fontSize)
                    } else {
                        imgs[i].width = 170 / 100 * fontSize;
                        $(".text").width(170 / 100 * fontSize)
                    }
                    imgs[i].onload = function() {

                        $.hideLoading();

                        let div = document.createElement("div");
                        div.className = "item";
                        div.append(imgs[i]);
                        $(div).append("<div class='text'><p class='title'>" + pics[i]._title + "</p></div>");
                        if (toggleFlag) {
                            $(".item").width(375 / 100 * fontSize);
                            $(".text").width(375 / 100 * fontSize);
                        } else {
                            $(".item").width(170 / 100 * fontSize);
                            $(".text").width(170 / 100 * fontSize);
                        }
                        $(div).wrapInner(`<a href="./details/${pics[i]._imgId}"></a>`);
                        box.append(div);
                        resolve();

                    }
                });
            }
            Promise.all(PromiseALl).then(() => {
                if (toggleFlag) {
                    $(".item").width(375 / 100 * fontSize);
                    $(".text").width(375 / 100 * fontSize);
                } else {
                    $(".item").width(170 / 100 * fontSize);
                    $(".text").width(170 / 100 * fontSize);
                }

                loading = false;
            }).catch((reason) => {
                console.log(reason)
            });
        },
        error: err => {
            console.log(err)
        }
    });
}
// clientWidth 处理兼容性 
function getClient() {
    return {
        width: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    }
}
// scrollTop兼容性处理 
function getScrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop;
}

function initpage() {
    var view_width = document.getElementsByTagName('html')[0].getBoundingClientRect().width;
    var _html = document.getElementsByTagName('html')[0];
    _html.style.fontSize = (view_width / 375) * 100 + 'px';
    fontSize = (view_width / 375) * 100;
}