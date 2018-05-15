var fontSize;
let toggleFlag = false; //单双列
let mode; //模式 random normal tops
var loading = true; //下拉刷新加载状态
var page = 0; //页数
let imgLoading = true; //图片正在加载
initpage();
$(".item img").css("width", '1.845rem'); //初始化二列
$.showLoading();
var box = document.getElementById('container');
var items = box.children;
console.log(items)
    // 定义每一列之间的间隙 为2像素 
var gap = 2;
window.onload = function() {
    $("#getRandom").addClass("toggle_now");
    $("#getRandom").removeClass("toggle");
    if (parseInt(localStorage.getItem("page")) > 0) {
        $.confirm({
            title: "跳一跳",
            text: "是否跳转至上次观看的地方",
            onOK: function() {
                page = parseInt(localStorage.getItem("page"));
                if (mode == "tops") {
                    getTops(page - 1);
                    $("#getTops").addClass("toggle_now");
                    $("#getTops").removeClass("toggle");
                } else if (mode == "normal") {
                    getPics(page - 1);
                    $("#getPics").addClass("toggle_now");
                    $("#getPics").removeClass("toggle");
                } else if (mode == "random") {
                    getRandom();
                    $("#getRandom").addClass("toggle_now");
                    $("#getRandom").removeClass("toggle");
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
        // getPics()
    }


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
    // 当加载到第最后一张的时候 
    $(document.body).infinite(150).on("infinite", function() {
        if (loading) return;
        loading = true;
        page = parseInt(localStorage.getItem("page"));
        // console.log(page)
        if (mode == "normal") {
            getPics(page);
        } else if (mode == "tops") {
            getTops(page);
        } else if (mode == "random") {
            console.log("加载随机")
            getRandom()
        }

    });
};

//单双列
$("#toggleList").click(function() {
    if (toggleFlag == false) {
        $(".item img").css("width", '3.75rem');
        $(".item img").css("height", '5.625rem');
        $("#toggleList").text("双列");
        // waterFall();
        toggleFlag = true;
    } else {
        $(".item img").css("width", '1.7rem');
        $(".item img").css("height", '2.55rem');
        $("#toggleList").text("单列");
        // waterFall();
        toggleFlag = false;
    }

});

//切换模式
$("#toolbar").on("click", ".mode", function() {
    $.showLoading();
    imgLoading = false;
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
        mode = "tops";
        localStorage.setItem("mode", "tops");
    } else if (nodeId == "getPics") {
        getPics(page);
        mode = "normal";
        localStorage.setItem("mode", "normal");
    } else if (nodeId == "getRandom") {
        getRandom();
        mode = "random";
        localStorage.setItem("mode", "random");
    }
});

function getRandom() {
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
                pics.push(data[i][0]._dir); //数据格式问题，这里是二维数组
            }
            let PromiseALl = []; //所有异步操作
            let imgs = []; //新的图片集合
            for (let i in pics) {
                PromiseALl[i] = new Promise((resolve, reject) => {
                    imgs[i] = new Image();
                    imgs[i].src = pics[i];
                    imgs[i].alt = "猜一猜";
                    imgs[i].className = "mmImg";
                    if (toggleFlag) {
                        imgs[i].width = 373 / 100 * fontSize;
                    } else {
                        imgs[i].width = 184.5 / 100 * fontSize;
                    }
                    imgs[i].onload = function() {
                        if (imgLoading) {
                            $.hideLoading();
                            console.log(i, imgLoading);
                            let div = document.createElement("div");
                            div.className = "item";
                            div.append(imgs[i]);
                            box.append(div);
                            waterFall();
                            resolve();
                        } else {
                            console.log(i, imgLoading);
                            resolve();
                        }
                    }
                });
            }
            Promise.all(PromiseALl).then(() => {
                imgLoading = true;
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
                pics.push(data[i]._dir);
            }
            let PromiseALl = []; //所有异步操作
            let imgs = []; //新的图片集合
            for (let i in pics) {
                PromiseALl[i] = new Promise((resolve, reject) => {
                    imgs[i] = new Image();
                    imgs[i].src = pics[i];
                    imgs[i].alt = "猜一猜";
                    imgs[i].className = "mmImg";
                    if (toggleFlag) {
                        imgs[i].width = 373 / 100 * fontSize;
                    } else {
                        imgs[i].width = 184.5 / 100 * fontSize;
                    }
                    imgs[i].onload = function() {
                        if (imgLoading) {
                            $.hideLoading();
                            console.log(i, imgLoading);
                            let div = document.createElement("div");
                            div.className = "item";
                            div.append(imgs[i]);
                            box.append(div);
                            waterFall();
                            resolve();
                        } else {
                            console.log(i, imgLoading);
                            resolve();
                        }
                    }
                });
            }
            Promise.all(PromiseALl).then(() => {
                imgLoading = true;
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
function getPics(page) {
    // console.log(page)
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
                pics.push(data[i]._dir);
            }
            let PromiseALl = []; //所有异步操作
            let imgs = []; //新的图片集合
            for (let i in pics) {
                PromiseALl[i] = new Promise((resolve, reject) => {
                    imgs[i] = new Image();
                    imgs[i].src = pics[i];
                    imgs[i].alt = "猜一猜";
                    imgs[i].className = "mmImg";
                    if (toggleFlag) {
                        imgs[i].width = 373 / 100 * fontSize;
                    } else {
                        imgs[i].width = 184.5 / 100 * fontSize;
                    }
                    imgs[i].onload = function() {
                        if (imgLoading) {
                            $.hideLoading();
                            console.log(i, imgLoading);
                            let div = document.createElement("div");
                            div.className = "item";
                            div.append(imgs[i]);
                            box.append(div);
                            waterFall();
                            resolve();
                        } else {
                            console.log(i, imgLoading);
                            resolve();
                        }
                    }
                });
            }
            Promise.all(PromiseALl).then(() => {
                imgLoading = true;
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
// 瀑布流行为封装成一个函数 
function waterFall() {
    // 1- 确定列数 = 页面的宽度 / 图片的宽度 
    var pageWidth = getClient().width;
    var itemWidth = items[0].offsetWidth; //图片宽度
    var columns = parseInt(pageWidth / (itemWidth + gap)); //一行两张图片
    var arr = []; //高度的数组
    for (var i = 0; i < items.length; i++) {
        if (i < columns) {
            // 2- 确定第一行
            items[i].style.top = 0;
            items[i].style.left = (gap + (itemWidth + gap) * i) / fontSize + 'rem'; //最左侧一个间隙
            arr.push(items[i].offsetHeight);
        } else {
            // 其他行 
            // 3- 找到数组中最小高度 和 它的索引 
            var minHeight = arr[0];
            var index = 0;
            for (var j = 0; j < arr.length; j++) {
                if (minHeight > arr[j]) {
                    minHeight = arr[j];
                    index = j;
                }
            }
            // 4- 设置下一行的第一个盒子位置 
            // top值就是最小列的高度 + gap 
            items[i].style.top = (arr[index] + gap) / fontSize + 'rem';
            // left值就是最小列距离左边的距离 
            items[i].style.left = items[index].offsetLeft / fontSize + 'rem';
            // 5- 修改最小列的高度 // 最小列的高度 = 当前自己的高度 + 拼接过来的高度 + 间隙的高度 
            arr[index] = arr[index] + items[i].offsetHeight + gap;
        }
    }
    $("#container").css("visibility", "visible");
    //设置container高度
    let heightArr = [];
    let maxHeight; //最底处
    //图片必须大于2张
    if (items.length > columns) {
        for (let i = 0; i < columns; i++) {
            let height = items[items.length - 1 - i].offsetTop + items[items.length - 1 - i].offsetHeight;
            heightArr.push(height);
        }
        for (let i = 0; i < heightArr.length; i++) {
            maxHeight = Math.max.apply(null, heightArr);
        }
        //设置container高度用于定位加载
        $("#container").css("height", maxHeight + 'px');
    }
};
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