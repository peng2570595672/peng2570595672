/**
 * @cyl
 *  */
const util = require('./util');
const tonDunObj = {
	fingerprint: '',
	sessionId: '',
	goodsListNum: '',
	smscode: ''
}
let app = getApp();
let signList = null;
let checkBindStatusList = null;
let queryIntegralList = null;
let getVerificationCodeList = {
	data: {
		token: "cc54c98727e6bc52742ee1a1627acfc1",
		type: 1,
		validateToken: 'hjmh3KQTo9EZ3nRNvlDgOLK2sbr0aEjhxL0%2BODi5wfy88%2F9pFeiTHsf3xhYCQ7eP%2FkNAhX3KMxrmHo6aJd3jNA%3D%3D'
	}
}
let queryProductsList = null;
let prepareOrderList = null;
let queryScoreCodeList = null;
let exchangeScoreList = null;
let makeOrderList = null;
// let bindChangYouList = null;


// 获取openid函数，支持传入回调函数
function getUserInfo(callback) {
	wx.checkSession({
		success: function(res) {
			console.log(res);
			// 这里把加密后的openid存入缓存，下次就不必再去发起请求
			const openId = wx.getStorageSync('user_code');
			if (openId) {
				console.log(openId);
				app.globalData.openId = openId;
				callback(0, openId); // 回调函数接受两个参数，第一个代表code种类，0为openId，1为code
			} else {
				// 如果缓存中没有，则需要再次调用登录接口获取code
				wx.login({
					success: function(res) {
						console.log(res);
						app.globalData.code = res.code;
						callback(1, res.code);
					}
				})
			}
		},
		fail: function(res) {
			console.log("失败");
			console.log(res);
			wx.login({
				success: function(res) {
					console.log(res);
					app.globalData.code = res.code;
					callback(1, res.code);
				}
			})
		}
	})
};

// 上传图片 并返回url 地址
function uploadFile_1() {
	wx.chooseImage({
		success(res) {
			console.log(res.tempFilePaths)
			const tempFilePaths = res.tempFilePaths
			wx.uploadFile({
				url: 'https://file.cyzl.com/file/upload', //仅为示例，非真实的接口地址
				filePath: tempFilePaths[0],
				name: 'file',
				success(res) {
					const data = JSON.parse(res.data)
					console.log(data.data[0].fileUrl)
				}
			})
		}
	})
}

async function changYouApi(obj) {
	console.log(obj);
	switch (obj) {
		case 'sign':
			// 登记接口 获取 myOrderId
			signList = await util.getDataFromServersV2('consumer/member/changyou/sign');
			console.log("登记接口 ");
			console.log(signList);
			return signList;
			break;
		case 'checkBindStatus':
			// 畅游是否绑定 false->未绑定  true->已绑定
			checkBindStatusList = await util.getDataFromServersV2('consumer/member/changyou/checkBindStatus', {
				myOrderId: signList.data.myOrderId,
				fingerprint: tonDunObj.fingerprint,
				sessionId: tonDunObj.sessionId
			});
			console.log("畅游是否绑定 ");
			console.log(checkBindStatusList);
			return checkBindStatusList;
			break;
		case 'queryIntegral':
			// 查询积分 查看是否授权
			const queryIntegralList = await util.getDataFromServersV2('consumer/member/changyou/queryScores', {
				myOrderId: signList.data.myOrderId,
				fingerprint: tonDunObj.fingerprint,
				sessionId: tonDunObj.sessionId
			})
			console.log("查询积分 ");
			console.log(queryIntegralList);
			return queryIntegralList;
			break;
		case 'getVerificationCode':
			// 获取绑定验证码 有请求数量限制
			getVerificationCodeList = await util.getDataFromServersV2('consumer/member/changyou/queryBindCode', {
				myOrderId: signList.data.myOrderId
			})
			console.log("获取绑定验证码 ");
			console.log(getVerificationCodeList);
			return getVerificationCodeList;
			break;
		case 'bindChangYou':
			// 绑定畅游
			const bindChangYouList = await util.getDataFromServersV2('consumer/member/changyou/bindChangYou', {
				myOrderId: signList.data.myOrderId,
				token: getVerificationCodeList.data.token,
				type: getVerificationCodeList.data.type,
				smscode: tonDunObj.smscode,
				validateToken: getVerificationCodeList.data.validateToken
			})
			console.log("绑定畅游 ");
			console.log(bindChangYouList);
			return bindChangYouList;
			break;
		case 'queryProducts':
			// 查询商品
			queryProductsList = await util.getDataFromServersV2('consumer/member/changyou/queryProducts', {
				myOrderId: signList.data.myOrderId,
				pageNum: '1',
				pageSize: '10'
			})
			console.log("查询商品 ")
			console.log(queryProductsList)
			return queryProductsList;
			break;
		case 'prepareOrder':
			// 预下单
			prepareOrderList = await util.getDataFromServersV2('consumer/member/changyou/prepareOrder', {
				myOrderId: signList.data.myOrderId,
				couponConfigId: queryProductsList.data.list[tonDunObj.goodsListNum].id,
				actualPrice: queryProductsList.data.list[tonDunObj.goodsListNum].goodPoints,
				goodsList: [{
					goodsNo: queryProductsList.data.list[tonDunObj.goodsListNum].goodsNo,
					goodsNum: 1
				}]
			})
			console.log("预下单 ");
			console.log(prepareOrderList);
			return prepareOrderList;
			break;
		case 'queryScoreCode':
			// 获取兑换积分验证码
			queryScoreCodeList = await util.getDataFromServersV2('consumer/member/changyou/queryScoreCode', {
				myOrderId: signList.data.myOrderId,
				outerOrderId: prepareOrderList.data.sessionId,
				outerPoints: "500",
				orderId: prepareOrderList.data.orderId
			})
			console.log("获取兑换积分验证码 ");
			console.log(queryScoreCodeList);
			return queryScoreCodeList;
			break;
		// case 'exchangeScore':
		// 	// 兑换积分
		// 	exchangeScoreList = await util.getDataFromServersV2('consumer/member/changyou/exchangeScore', {
		// 		myOrderId: signList.data.myOrderId,
		// 		outerOrderId: prepareOrderList.data.sessionId,
		// 		outerPoints: "500",
		// 		orderId: prepareOrderList.data.orderId,
		// 		optCode: 
		// 	})
		// 	console.log("兑换积分");
		// 	console.log(exchangeScoreList);
		// 	return exchangeScoreList;
		// 	break;
		// case 'makeOrder':
		// 	// 下单
		// 	makeOrderList = await util.getDataFromServersV2('consumer/member/changyou/makeOrder', {
		// 		myOrderId: signList.data.myOrderId,
		// 		orderId: prepareOrderList.data.orderId,
		// 		sessionId: tonDunObj.sessionId,
		// 		mobileCode: 
		// 	})
		// 	console.log("下单");
		// 	console.log(makeOrderList);
		// 	return makeOrderList;
		// 	break;
		default:
			break;
	}
}





module.exports = {
	getUserInfo,
	uploadFile_1,
	changYouApi,
	tonDunObj
}
