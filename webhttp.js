var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

function httpGet(url)  {
    var promise = new Promise(function(resolve, reject) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open ("get", url, true); // 异步请求  
        xmlhttp.onreadystatechange = handler;
        xmlhttp.responseType = "json";
        xmlhttp.setRequestHeader ("Content-Type",  "application/x-www-form-urlencoded; charset=UTF-8");     
        xmlhttp.send (null);  
        function handler() {
            if (this.readyState !== 4) {
                return;
            }
            if (this.status === 200) {
                // console.log("服务端请求:" + url + "请求成功:status:" + xmlhttp.status + " readyState:" + xmlhttp.readyState);
                resolve(this.responseText);
            } else {
                reject(new Error(this.statusText));
            }
        };
    });
    return promise;
};

function httpPost(url,  data)  { 
    var promise = new Promise(function(resolve, reject) {
        var xmlhttp = new XMLHttpRequest();
        // console.log("新增: " + url, "data是",  data); 
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if ((xmlhttp.status >= 200 && xmlhttp.status < 300) || xmlhttp.status == 304) {
                    // console.log("服务端请求:-------->" + "请求成功:status:" + xmlhttp.status + " readyState:" + xmlhttp.readyState);
                    resolve(xmlhttp.responseText);
                } else {
                    reject(new Error(xmlhttp.statusText))
                }
            }
        };
        xmlhttp.open ("post",  url, true);     
        xmlhttp.setRequestHeader ("Content-Type",  "application/x-www-form-urlencoded; charset=UTF-8");     
        xmlhttp.send (data);
    });
    return promise;
};

function  httpPut(url, data)  { 
    var promise = new Promise(function(resolve, reject) {
        var xmlhttp = new XMLHttpRequest();
        console.log("修改: " + url);  
        xmlhttp.onreadystatechange = handler;       
        xmlhttp.open ("put",  url, true);     
        xmlhttp.setRequestHeader ("Content-Type",  "application/x-www-form-urlencoded; charset=UTF-8");     
        xmlhttp.send (data); 
        function handler() {
            if (this.readyState !== 4) {
                return;
            }
            if (this.status === 200) {
                // console.log("服务端请求:" + url + "请求成功:status:" + xmlhttp.status + " readyState:" + xmlhttp.readyState);
                resolve(this.responseText);
            } else {
                reject(new Error(this.statusText));
            }
        };
    });
    return promise;
};

function  httpDelete(url)  {
    var promise = new Promise(function(resolve, reject) {
        var xmlhttp = new XMLHttpRequest();
        console.log("删除: " + url); 
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if ((xmlhttp.status >= 200 && xmlhttp.status < 300) || xmlhttp.status == 304) {
                    // console.log("服务端请求成功:status:" + xmlhttp.status + " readyState:" + xmlhttp.readyState);
                    resolve(this.responseText);
                } else {
                    // console.log("请求失败" + xmlhttp.status + "状态吗" + xmlhttp.readyState);
                    reject(new Error(this.statusText));
                }
            }
        }; 
        xmlhttp.open ("delete",  url, true); 
        xmlhttp.setRequestHeader ("Content-Type",  "application/x-www-form-urlencoded; charset=UTF-8");     
        xmlhttp.send (null); 
    });
    return promise;
} 

module.exports = {
    httpGet: httpGet,
    httpPost: httpPost,
    httpPut: httpPut,
    httpDelete: httpDelete
};