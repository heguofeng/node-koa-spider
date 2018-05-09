var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/position"); //position是数据库
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
var PositionSchema = new mongoose.Schema({
    // _id: { type: Number, default: function() { return i++; } },
    username: { type: String },
    avatarUrl: { type: String },
    latitude: { type: String },
    longitude: { type: String },
    speed: { type: String },
    onlineStatus: { type: Boolean }
});

//创建模型，可以用它来操作数据库中的location集合，相当于的是mysql的表
//加入第三个参数为collection name，否则会变成复数
var PositionModel = db.model("location", PositionSchema, "location");

module.exports = {
    //获取所有的位置记录
    getLocations: () => {
        return new Promise((resolve, reject) => {
            try {
                PositionModel.find(function(err, res) {
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
                PositionModel.find({ onlineStatus: true }, function(err, res) {
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
    //创建一条人物位置记录
    postMan: (username, avatarUrl) => {
        //创建一个实体
        return new Promise((resolve, reject) => {
            try {
                var PositionEntity = new PositionModel({
                    username: username,
                    avatarUrl: avatarUrl,
                    latitude: '',
                    longitude: '',
                    speed: '',
                    onlineStatus: false
                });
                PositionEntity.save(function(err, res) {
                    if (err) {
                        console.log(common.formatDateTime(new Date()) + "人物保存出错" + err);
                        reject(err);
                    } else {
                        console.log(common.formatDateTime(new Date()), res.username, " 保存成功")
                        resolve(res)
                    }
                });
            } catch (error) {
                reject(error)
            }

        })
    },
    //修改第一次位置
    putOriginLocation: (_id, latitude, longitude, speed, onlineStatus) => {
        return new Promise((resolve, reject) => {
            try {
                //findOneAndUpdate坑爹，返回的是修改前的数据
                PositionModel.findOneAndUpdate({ _id: _id }, {
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
                PositionModel.findOneAndUpdate({ _id: _id }, {
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
                PositionModel.findOneAndUpdate({ _id, _id }, {
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
                PositionModel.find({ _id: _id }, function(err, res) {
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