/**
 * @author 狂奔的蜗牛
 * @desc 选择支付方式
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		showChoiceBank: true, // 选择套餐
		choiceSetMeal: undefined, // 选择支付方式逐渐
		choiceObj: undefined, // 选择的套餐
		bankCardIdentifyResult: {
			ocrObject: {}
		},// 银行卡识别结果
		idCardFace: {
			ocrObject: {}
		},// 身份证正面
		userName: undefined,// 身份证正面 原始数据,用于与新数据比对(秒审)
		idNumber: undefined,// 身份证正面 原始数据,用于与新数据比对(秒审)
		idCardBack: {
			ocrObject: {}
		},// 身份证反面
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		orderInfo: undefined // 订单信息
	},
	onLoad () {
		// app.globalData.orderInfo.orderId = '658608879176781824';
		// app.globalData.userInfo.accessToken = 'NjU3NjE0MDE0NjQ1MjcyNTc2OjEyMzQ1Njc4OTAxMjM0NTY3ODo1N2MzNDExYzFiZDY0NzMzYTNlNzMzNWI0YjE4MDg2OQ==';
		this.getOrderInfo();
	},
	// 获取订单信息
	getOrderInfo () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '45'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					orderInfo: res.data
				});
				// 获取实名信息
				let temp = this.data.orderInfo['idCard'];
				if (temp.idCardStatus === 1) {
					let idCardFace = this.data.idCardFace;
					// 身份证反面
					let idCardBack = this.data.idCardBack;
					idCardBack.fileUrl = temp.idCardNegativeUrl;
					// 身份证正面
					idCardFace.fileUrl = temp.idCardPositiveUrl;
					idCardFace.ocrObject.name = temp.idCardTrueName;
					idCardFace.ocrObject.address = temp.idCardAddress;
					idCardFace.ocrObject.sex = temp.idCardSex === 1 ? '男' : '女';
					idCardFace.ocrObject.validDate = temp.idCardValidDate;
					idCardFace.ocrObject.idNumber = temp.idCardNumber;
					this.setData({
						idCardFace,
						idCardBack,
						userName: temp.idCardTrueName,
						idNumber: temp.idCardNumber
					});
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	onShow () {
		// 银行卡
		let bankCardIdentifyResult = wx.getStorageSync('bank_card_identify_result');
		if (bankCardIdentifyResult) {
			bankCardIdentifyResult = JSON.parse(bankCardIdentifyResult);
			this.setData({
				bankCardIdentifyResult: bankCardIdentifyResult.data[0]
			});
			this.setData({
				available: this.validateAvailable()
			});
			wx.removeStorageSync('bank_card_identify_result');
		}
		// 身份证正面
		let idCardFace = wx.getStorageSync('id_card_face');
		if (idCardFace) {
			idCardFace = JSON.parse(idCardFace);
			this.setData({
				idCardFace: idCardFace.data[0],
				userName: idCardFace.data[0].ocrObject.name,
				idNumber: idCardFace.data[0].ocrObject.idNumber
			});
			this.setData({
				available: this.validateAvailable()
			});
			wx.removeStorageSync('id_card_face');
		}
		// 身份证反面
		let idCardBack = wx.getStorageSync('id_card_back');
		if (idCardBack) {
			idCardBack = JSON.parse(idCardBack);
			this.setData({
				idCardBack: idCardBack.data[0]
			});
			this.setData({
				available: this.validateAvailable()
			});
			wx.removeStorageSync('id_card_back');
		}
	},
	// 选择银行
	choiceSetMeal () {
		if (!this.data.choiceSetMeal) {
			this.setData({
				choiceSetMeal: this.selectComponent('#choiceSetMeal')
			});
		}
		this.data.choiceSetMeal.switchDisplay(true);
	},
	// 拦截点击非透明层空白处事件
	onClickTranslucentHandle () {
		this.data.choiceSetMeal.switchDisplay(false);
	},
	// 具体支付方式
	onClickItemHandle (e) {
		// 统计点击事件
		mta.Event.stat('030',{});
		this.setData({
			choiceObj: e.detail.targetObj
		});
		app.globalData.isHeadImg = e.detail.targetObj.isHeadImg === 1 ? true : false;
		app.globalData.orderInfo.shopProductId = e.detail.targetObj.shopProductId;
		this.setData({
			available: this.validateAvailable()
		});
		this.data.choiceSetMeal.switchDisplay(false);
	},
	// 拍照 银行卡
	onClickShotBankCardHandle (e) {
		let type = e.currentTarget.dataset.type;
		util.go(`/pages/default/shot_bank_card/shot_bank_card?type=${type}`);
	},
	// 签约
	next () {
		// 统计点击事件
		mta.Event.stat('028',{});
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		this.setData({
			isRequest: true,
			available: false
		});
		let IdCardHaveChange = true;
		if (this.data.userName === this.data.idCardFace.ocrObject.name && this.data.idNumber === this.data.idCardFace.ocrObject.idNumber) {
			IdCardHaveChange = false;
		}
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: '348', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			shopProductId: this.data.choiceObj.shopProductId,
			areaCode: this.data.choiceObj.areaCode,
			shopId: this.data.choiceObj.shopId,
			idCardStatus: this.data.orderInfo['idCard'].idCardStatus,
			idCardValidDate: this.data.idCardBack.ocrObject.validDate,
			idCardAddress: this.data.idCardFace.ocrObject.address,
			idCardTrueName: this.data.idCardFace.ocrObject.name, // 实名认证姓名 【dataType包含4】
			idCardSex: this.data.idCardFace.ocrObject.sex === '男' ? 1 : 2, // 实名认证性别 【dataType包含4】
			idCardNumber: this.data.idCardFace.ocrObject.idNumber, // 实名认证身份证号 【dataType包含4】
			idCardAuthority: this.data.idCardBack.ocrObject.authority, // 发证机关 【dataType包含4】
			idCardBirth: this.data.idCardFace.ocrObject.birth, // 出生日期 【dataType包含4】
			idCardPositiveUrl: this.data.idCardFace.fileUrl, // 实名身份证正面地址 【dataType包含4】
			idCardNegativeUrl: this.data.idCardBack.fileUrl, // 实名身份证反面地址 【dataType包含4】
			ownerIdCardTrueName: this.data.idCardFace.ocrObject.name, // 实名认证姓名 【dataType包含8】
			ownerIdCardNumber: this.data.idCardFace.ocrObject.idNumber, // 实名认证身份证号 【dataType包含8】
			ownerIdCardPositiveUrl: this.data.idCardFace.fileUrl, // 实名身份证正面地址 【dataType包含8】
			ownerIdCardNegativeUrl: this.data.idCardBack.fileUrl, // 实名身份证反面地址 【dataType包含8】
			ownerIdCardSex: this.data.idCardFace.ocrObject.sex === '男' ? 1 : 2, // 实名认证性别 【dataType包含8】
			ownerIdCardAuthority: this.data.idCardBack.ocrObject.authority, // 发证机关 【dataType包含8】
			ownerIdCardBirth: this.data.idCardFace.ocrObject.birth, // 出生日期 【dataType包含8】
			ownerIdCardValidDate: this.data.idCardBack.ocrObject.validDate,
			ownerIdCardAddress: this.data.idCardFace.ocrObject.address,
			ownerIdCardHaveChange: IdCardHaveChange, // 车主身份证OCR结果是否被修改过，默认false，修改过传true 【dataType包含8】
			needSignContract: true // 是否需要签约 true-是，false-否 允许值: true, false
		};
		// 银行卡 3.0
		if (this.data.choiceObj.productProcess === 3) {
			params.dataType = '345';
			params['bankAccountNo'] = this.data.bankCardIdentifyResult.ocrObject.cardNo; // 银行卡号 【dataType包含5】
			params['bankCardUrl'] = this.data.bankCardIdentifyResult.fileUrl; // 银行卡图片地址 【dataType包含5】
			params['bankName'] = this.data.bankCardIdentifyResult.ocrObject.cardName; // 银行名称 【dataType包含5】
			params['bankAccountType'] = 1; // 账户类型 1-一类户 2-二类户 3-三类户 【dataType包含5】允许值: 1, 2, 3
			params['bankCardType'] = this.data.bankCardIdentifyResult.ocrObject.cardType === '借记卡' ? 1 : 2; // 银行卡种 1-借记卡 2-贷记卡 【dataType包含5】允许值: 1, 2;
		}
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				app.globalData.signAContract = -1;
				app.globalData.orderInfo.shopProductId = this.data.choiceObj.shopProductId;
				let result = res.data.contract;
				// 签约车主服务 2.0
				app.globalData.belongToPlatform = app.globalData.platformId;
				if (result.version === 'v2') {
					wx.navigateToMiniProgram({
						appId: 'wxbcad394b3d99dac9',
						path: 'pages/route/index',
						extraData: result.extraData,
						fail () {
							util.showToastNoIcon('调起车主服务签约失败, 请重试！');
						}
					});
				} else { // 签约车主服务 3.0
					wx.navigateToMiniProgram({
						appId: 'wxbcad394b3d99dac9',
						path: 'pages/etc/index',
						extraData: {
							preopen_id: result.extraData.peropen_id
						},
						fail () {
							util.showToastNoIcon('调起车主服务签约失败, 请重试!');
						}
					});
				}
				// util.go('/pages/default/signed_successfully/signed_successfully');
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				available: true,
				isRequest: false
			});
		});
	},
	validateAvailable () {
		// 是否接受协议
		let isOk = this.data.choiceObj ? true : false;
		// 银行卡验证
		if (isOk && this.data.choiceObj.productProcess === 5) {
			console.log(1);
			isOk = isOk && this.data.bankCardIdentifyResult.fileUrl;
			isOk = isOk && this.data.bankCardIdentifyResult.ocrObject.cardNo && util.luhmCheck(this.data.bankCardIdentifyResult.ocrObject.cardNo);
		}
		// 是否为微信2.0
		if (isOk) {
			// 验证图片是否存在
			isOk = isOk && this.data.idCardFace.fileUrl && this.data.idCardBack.fileUrl;
			// 验证姓名
			isOk = isOk && this.data.idCardFace.ocrObject.name && this.data.idCardFace.ocrObject.name.length >= 2;
			// 验证身份证号
			isOk = isOk && /^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$|^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X)$/.test(this.data.idCardFace.ocrObject.idNumber);
		}
		return isOk;
	},
	// 姓名和身份证输入
	onInputChangedHandle (e) {
		let value = e.detail.value;
		let key = e.currentTarget.dataset.key;
		let idCardFace = this.data.idCardFace;
		idCardFace.ocrObject[key] = value;
		this.setData({
			idCardFace
		});
		this.setData({
			available: this.validateAvailable()
		});
	},
	// 预览图片
	onPreviewPicture (e) {
		let url = e.currentTarget.dataset.url;
		let url1 = e.currentTarget.dataset.url1;
		wx.previewImage({
			current: url, // 当前显示图片的http链接
			urls: [url, url1] // 需要预览的图片http链接列表
		});
	},
	onCardNoInputChangedHandle (e) {
		let value = e.detail.value.trim();
		let bankCardIdentifyResult = this.data.bankCardIdentifyResult;
		bankCardIdentifyResult.ocrObject.cardNo = value;
		this.setData({
			bankCardIdentifyResult,
			available: this.validateAvailable()
		});
	},
	// 取消订单
	cancelOrder () {
		util.showLoading({
			title: '取消中...'
		});
		util.getDataFromServer('consumer/order/cancel-order', {
			orderId: app.globalData.orderInfo.orderId
		}, () => {
			util.showToastNoIcon('取消订单失败！');
		}, (res) => {
			if (res.code === 0) {
				util.go('/pages/personal_center/cancel_order_succeed/cancel_order_succeed');
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	onUnload () {
		// 统计点击事件
		mta.Event.stat('029',{});
		// 加上存储,控制签约后的返回不提示
		if (wx.getStorageSync('return_to_prompt')) {
			util.alert({
				content: '您还未领取免费ETC设备，确认取消吗？',
				showCancel: true,
				cancelText: '取消办理',
				confirmText: '手误了',
				confirm: () => {
					util.go('/pages/default/payment_way/payment_way');
				},
				cancel: () => {
					wx.removeStorageSync('return_to_prompt');
					if (app.globalData.orderInfo.orderId) {
						this.cancelOrder();
					}
				}
			});
		}
	}
});
