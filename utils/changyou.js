/**
 * @cyl
 *  */
const util = require('./util');
const tonDunObj = {
	fingerprint: '',
	sessionId: '',
	goodsListNum: '',
}
let app = getApp();
let signList = null;
let checkBindStatusList = null;
let queryIntegralList = null;
let getVerificationCodeList = null;
let queryProductsList = null;
let queryScoresList = null;
let prepareOrderList = null;
let queryScoreCodeList = null;

// 获取openid函数，支持传入回调函数
function getUserInfo(callback) {
	wx.checkSession({
		success: function(res) {
			// 这里把加密后的openid存入缓存，下次就不必再去发起请求
			const openId = wx.getStorageSync('user_code');
			if (openId) {
				app.globalData.openId = openId;
				callback(0, openId); // 回调函数接受两个参数，第一个代表code种类，0为openId，1为code
			} else {
				// 如果缓存中没有，则需要再次调用登录接口获取code
				wx.login({
					success: function(res) {
						app.globalData.code = res.code;
						callback(1, res.code);
					}
				})
			}
		},
		fail: function(res) {
			wx.login({
				success: function(res) {
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
			console.log(queryIntegralList);
			return queryIntegralList;
			break;
		case 'getVerificationCode':
			// 获取绑定验证码 有请求数量限制
			getVerificationCodeList = await util.getDataFromServersV2('consumer/member/changyou/queryBindCode', {
				myOrderId: signList.data.myOrderId
			})
			console.log(getVerificationCodeList);
			return getVerificationCodeList;
			break;
		case 'bindChangYou':
			// 绑定畅游
			bindChangYouList = await util.getDataFromServersV2('consumer/member/changyou/bindChangYou', {
				myOrderId: signList.data.myOrderId,
				token: getVerificationCodeList.data.token,
				type: getVerificationCodeList.data.type,
				smscode: getVerificationCodeList.data.smscode,
				validateToken: getVerificationCodeList.data.validateToken
			})
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
			console.log(queryProductsList)
			return queryProductsList;
			break;
		case 'queryScores':
			// 查询积分
			queryScoresList = await util.getDataFromServersV2('consumer/member/changyou/queryScores', {
				myOrderId: signList.data.myOrderId,
				fingerprint: tonDunObj.fingerprint,
				sessionId: tonDunObj.sessionId
			})
			console.log(queryScoresList);
			return queryScoresList;
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
			console.log(queryScoreCodeList);
			return queryScoreCodeList;
			break;
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
