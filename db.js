var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/mmjpg"); //position是数据库
var db = mongoose.connection;
const common = require('./common')
const config = require('./config');

let pageNums = config.pageNums;
//如果连接成功会执行error回调
db.on("error", function(error) {
    console.log(common.formatDateTime(new Date()) + "数据库连接失败：" + error);
});
//如果连接成功会执行open回调
db.once("open", function() {
    console.log(common.formatDateTime(new Date()) + "数据库连接成功");
});

//定义一个 schema,描述此集合里有哪些字段，字段是什么类型
var PicsSchema = new mongoose.Schema({
    // _id: { type: Number, default: function() { return i++; } },
    _dir: {
        type: String
    },
    _imgSrc: {
        type: String
    },
    _title: {
        type: String
    },
    _imgId: {
        type: Number
    },
    _link: {
        type: String
    },
    _visitors: {
        type: Number
    },
    _filename: {
        type: String
    }
});

//创建模型，可以用它来操作数据库中的location集合，相当于的是mysql的表
//加入第三个参数为collection name，否则会变成复数
var PicsModel = db.model("pictures", PicsSchema, "pictures");

module.exports = {
    //创建图片数据
    postPic: (_dir, _imgSrc, _title, _imgId, _link, _visitors, _filename) => {
        //创建一个实体
        return new Promise((resolve, reject) => {
            try {
                var PositionEntity = new PicsModel({
                    _dir: _dir,
                    _imgSrc: _imgSrc,
                    _title: _title,
                    _imgId: _imgId,
                    _link: _link,
                    _visitors: _visitors,
                    _filename: _filename
                });
                PositionEntity.save(function(err, res) {
                    if (err) {
                        console.log(common.formatDateTime(new Date()) + "图片保存出错" + err);
                        reject(err);
                    } else {
                        console.log(common.formatDateTime(new Date()), res._title, res._imgId, res._filename, " 图片保存成功")
                        resolve(res)
                    }
                });
            } catch (error) {
                reject(error)
            }

        })
    },
    //按imgId顺序 递减获取图片
    getPics: (page) => {
        return new Promise((resolve, reject) => {
            try {
                PicsModel.find({
                    "_link": null
                }).sort({
                    "_imgId": -1
                }).limit(pageNums).skip(page * pageNums).exec(function(err, res) {
                    if (err) {
                        console.log(err);
                        reject(err)
                    } else {
                        console.log("查询成功");
                        resolve(res);
                    }
                });
            } catch (error) {
                reject(error)
            }
        })
    },
    //获取排行榜 根据浏览量
    getTops: (page) => {
        return new Promise((resolve, reject) => {
            try {
                PicsModel.find({
                    "_link": null
                }).sort({
                    "_visitors": -1
                }).limit(pageNums).skip(page * pageNums).exec(function(err, res) {
                    if (err) {
                        console.log(err);
                        reject(err)
                    } else {
                        console.log("查询成功");
                        resolve(res);
                    }
                });
            } catch (error) {
                reject(error);
            }
        })
    },
    //随机获取图片
    getRandom: () => {
        //总数
        return new Promise((resolve, reject) => {
            PicsModel.find({
                "_link": null
            }).count(function(err, count) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    console.log(count)
                    try {
                        let promises = [];
                        let skip;
                        for (let i = 0; i < pageNums; i++) {
                            skip = Math.round(Math.random() * count);
                            // console.log(skip);
                            promises.push(PicsModel.find({
                                "_link": null
                            }).skip(skip).limit(1).exec());
                        }
                        Promise.all(promises).then(function(result) {
                            console.log("随机查询成功");
                            resolve(result);
                        });
                    } catch (error) {
                        console.log(error);
                    }
                }
            });
        });
    },
    //修改访问量
    putVisitors: (_dir, _visitors) => {
        return new Promise((resolve, reject) => {
            try {
                //findOneAndUpdate坑爹，返回的结果是修改前的数据,需要添加options的new为true
                PicsModel.update({
                    _dir: _dir
                }, {
                    $set: {
                        _visitors: _visitors,
                    }
                }, function(err, raw) {
                    if (err) {
                        console.log(common.formatDateTime(new Date()) + "更新访问量出错" + err);
                        reject(err);
                    } else {
                        console.log(common.formatDateTime(new Date()) + "更新访问量成功");
                        console.log(raw)
                        resolve(raw)
                    }
                })
            } catch (error) {
                reject(error)
            }
        });
    },
    //根据id查找一个人的图片
    getDetailsByImgId: (imgId) => {
        return new Promise((resolve, reject) => {
            try {
                PicsModel.find({
                    _imgId: imgId
                }, function(err, res) {
                    if (err) {
                        console.log(common.formatDateTime(new Date()) + "查找失败" + err);
                        reject(err)
                    } else {
                        console.log(common.formatDateTime(new Date()) + "根据图片id查找一个人成功")
                        resolve(res);
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }
}