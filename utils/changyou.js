// /**
//  * @cyl
//  *  */
// // 引用设备指纹SDK文件，两种方式均可，es6的方式推荐在小程序框架内使用
// var FMAgent = require('../../fmsdk/fm-1.6.0-umd.min.js')
// let app = getApp();

// // 获取openid函数，支持传入回调函数
// getUserInfo: function(callback) {
// 	wx.checkSession({
// 		success: function(res) {
// 			// 这里把加密后的openid存入缓存，下次就不必再去发起请求
// 			const openId = wx.getStorageSync('user_code');
// 			if (openId) {
// 				app.globalData.openId = openId;
// 				callback(0, openId); // 回调函数接受两个参数，第一个代表code种类，0为openId，1为code
// 			} else {
// 				// 如果缓存中没有，则需要再次调用登录接口获取code
// 				wx.login({
// 					success: function(res) {
// 						app.globalData.code = res.code;
// 						callback(1, res.code);
// 					}
// 				})
// 			}
// 		},
// 		fail: function(res) {
// 			wx.login({
// 				success: function(res) {
// 					app.globalData.code = res.code;
// 					callback(1, res.code);
// 				}
// 			})
// 		}
// 	})
// };

// // 获取openid函数
// getId: function(code_type, data) {
// 	var that = this;
// 	if (code_type == 0) {
// 		// openId
// 		// 如果成功拿到openid，则直接开始采集设备指纹
// 		that.getFp(data);
// 	} else if (code_type == 1) {
// 		// code
// 		// 如果拿到的是code，则需要传到后端，通过微信服务器拿到openid
// 		wx.request({
// 			url: 'http://localhost?' + data, // 'http://localhost'改为您服务器的url
// 			success: function(res) {
// 				console.log(res);
// 				// 保存user_code
// 				// 把openid保存到缓存中
// 				wx.setStorage({
// 					key: 'user_code',
// 					data: res.data.data,
// 				})
// 				// 如果成功拿到openid，则开始采集设备指纹
// 				that.getFp(res.data.data);
// 			}
// 		})
// 	} else {
// 		// wrong
// 	}
// };

// // 开始采集设备指纹，传入openid
// getFp: function(code) {
// 	var that = this;
// 	that.fmagent.getInfo({
// 		page: that,
// 		openid: code,
// 		success: function(res) {
// 			console.log('success');
// 			console.log(res);
// 		},
// 		fail: function(res) {
// 			console.log('fail');
// 			console.log(res);
// 		},
// 		complete: function(res) {}
// 	})
// }

// // 初始化设备指纹对象
// onloadFMAgent: function() {
// 	var that = this
// 	// 初始化设备指纹对象
// 	that.fmagent = new FMAgent(app.globalData._fmOpt);
// 	// 采集openid，成功后调用回调
// 	that.getUserInfo(getId());
// }







// // module.exports = {
// // 	getUserInfo,
// // 	getFp,
// // 	initFMAgent,
// // }
