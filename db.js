var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/mmjpg"); //position是数据库
var db = mongoose.connection;
const common = require('./common')
    //如果连接成功会执行error回调
db.on("error", function(error) {
    console.log(common.formatDateTime(new Date()) + "数据库连接失败：" + error);
});
//如果连接成功会执行open回调
db.once("open", function() {
    console.log(common.formatDateTime(new Date()) + "数据库连接成功");
});
//用来定义自增长id
var i = 0;

//定义一个 schema,描述此集合里有哪些字段，字段是什么类型
var PicsSchema = new mongoose.Schema({
    // _id: { type: Number, default: function() { return i++; } },
    _dir: { type: String },
    _imgSrc: { type: String },
    _title: { type: String },
    _imgId: { type: Number },
    _link: { type: String },
    _visitors: { type: Number },
    _filename: { type: String }
});

//创建模型，可以用它来操作数据库中的location集合，相当于的是mysql的表
//加入第三个参数为collection name，否则会变成复数
var PicsModel = db.model("pictures", PicsSchema, "pictures");

module.exports = {
    //获取所有的位置记录
    getLocations: () => {
        return new Promise((resolve, reject) => {
            try {
                PicsModel.find(function(err, res) {
                    if (err) {
                        console.log(common.formatDateTime(new Date()) + "所有数据查找出错" + err);
                        reject(err);
                    } else {
                        resolve(res)
                    }
                });
            } catch (error) {
                reject(error)
            }
        })
    },
    //获取线上的人
    getOnlineLocations: () => {
        return new Promise((resolve, reject) => {
            try {
                PicsModel.find({ onlineStatus: true }, function(err, res) {
                    if (err) {
                        console.log(common.formatDateTime(new Date()) + `获取正在线上的人的位置失败` + err);
                        reject(err);
                    } else {
                        console.log(common.formatDateTime(new Date()) + "获取正在线上的人的位置成功")
                        resolve(res)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    },
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
    getPics: (page) => {
        return new Promise((resolve, reject) => {
            try {
                PicsModel.find().sort({ "_id": 1 }).limit(30).skip(page * 30).exec(function(err, res) {
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
    //获取排行榜
    getTops: (page) => {
        return new Promise((resolve, reject) => {
            try {
                PicsModel.find().sort({
                    "_visitors": -1
                }).limit(30).skip(page * 30).exec(function(err, res) {
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
    //修改第一次位置
    putOriginLocation: (_id, latitude, longitude, speed, onlineStatus) => {
        return new Promise((resolve, reject) => {
            try {
                //findOneAndUpdate坑爹，返回的是修改前的数据
                PicsModel.findOneAndUpdate({ _id: _id }, {
                    $set: {
                        latitude: latitude,
                        longitude: longitude,
                        speed: speed,
                        onlineStatus: onlineStatus
                    }
                }, function(err, res) {
                    if (err) {
                        console.log(common.formatDateTime(new Date()) + "修改出错" + err);
                        reject(err);
                    } else {
                        console.log(common.formatDateTime(new Date()) + "第一次修改成功");
                        resolve(res)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })


    },
    //修改位置
    putLocations: (_id, latitude, longitude, speed) => {
        return new Promise((resolve, reject) => {
            try {
                PicsModel.findOneAndUpdate({ _id: _id }, {
                    $set: {
                        latitude: latitude,
                        longitude: longitude,
                        speed: speed
                    }
                }, function(err, res) {
                    if (err) {
                        console.log(common.formatDateTime(new Date()) + "更新位置出错" + err);
                        reject(err);
                    } else {
                        console.log(common.formatDateTime(new Date()) + "更新位置成功");
                        resolve(res)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })


    },
    //设置模式
    putOnlineStatus: (_id, onlineStatus) => {
        return new Promise((resolve, reject) => {
            try {
                PicsModel.findOneAndUpdate({ _id, _id }, {
                    $set: {
                        onlineStatus: onlineStatus,
                    }
                }, (err, res) => {
                    if (err) {
                        console.log(common.formatDateTime(new Date()) + '离线失败' + err);
                        reject(err);
                    } else {
                        console.log(common.formatDateTime(new Date()), `${onlineStatus==true?'上线成功':'离线成功'}`);
                        resolve(res)
                    }
                })
            } catch (error) {
                reject(error);
            }
        })
    },
    //根据id查找一个人
    getMan: (_id) => {
        return new Promise((resolve, reject) => {
            try {
                PicsModel.find({ _id: _id }, function(err, res) {
                    if (err) {
                        console.log(common.formatDateTime(new Date()) + "查找失败" + err);
                        reject(err)
                    } else {
                        console.log(common.formatDateTime(new Date()) + "根据id查找一个人成功")
                        resolve(res);
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }
}