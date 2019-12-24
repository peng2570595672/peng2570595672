/**
 * @author 狂奔的蜗牛
 * @desc 选择支付方式
 */
const util = require('../../../utils/util.js');
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
		idCardBack: {
			ocrObject: {}
		},// 身份证反面
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		orderInfo: undefined // 订单信息
	},
	onLoad () {
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
				let temp = this.data.orderInfo['4'];
				if (temp.idCardStatus === 1) {
					let idCardFace = this.data.idCardFace;
					// 身份证反面
					let idCardBack = this.data.idCardBack;
					idCardBack.fileUrl = temp.idCardNegativeUrl;
					// 身份证正面
					idCardFace.fileUrl = temp.idCardPositiveUrl;
					idCardFace.ocrObject.name = temp.idCardTrueName;
					idCardFace.ocrObject.idNumber = temp.idCardNumber;
					this.setData({
						idCardFace,
						idCardBack
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
			// wx.removeStorageSync('bank_card_identify_result');
		}
		// 身份证正面
		let idCardFace = wx.getStorageSync('id_card_face');
		if (idCardFace) {
			idCardFace = JSON.parse(idCardFace);
			this.setData({
				idCardFace: idCardFace.data[0],
				available: this.validateAvailable()
			});
			wx.removeStorageSync('id_card_face');
		}
		// 身份证反面
		let idCardBack = wx.getStorageSync('id_card_back');
		if (idCardBack) {
			idCardBack = JSON.parse(idCardBack);
			this.setData({
				idCardBack: idCardBack.data[0],
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
		this.setData({
			choiceObj: e.detail.targetObj
		});
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
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		this.setData({
			isRequest: true,
			available: false
		});
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: '34', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			shopProductId: this.data.choiceObj.shopProductId,
			areaCode: this.data.choiceObj.areaCode,
			shopId: this.data.choiceObj.shopId,
			idCardStatus: this.data.orderInfo['4'].idCardStatus,
			idCardTrueName: this.data.idCardFace.ocrObject.name, // 实名认证姓名 【dataType包含4】
			idCardNumber: this.data.idCardFace.ocrObject.idNumber, // 实名认证身份证号 【dataType包含4】
			idCardPositiveUrl: this.data.idCardFace.fileUrl, // 实名身份证正面地址 【dataType包含4】
			idCardNegativeUrl: this.data.idCardBack.fileUrl // 实名身份证反面地址 【dataType包含4】
		};
		// 银行卡 3.0
		if (this.data.choiceObj.isBankcard === 1) {
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
				util.go('/pages/default/signed_successfully/signed_successfully');
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
		if (isOk && this.data.choiceObj.isBankcard === 1) {
			console.log(1);
			isOk = isOk && this.data.bankCardIdentifyResult.fileUrl;
			isOk = isOk && this.data.bankCardIdentifyResult.ocrObject.cardNo && util.luhmCheck(this.data.bankCardIdentifyResult.ocrObject.cardNo);
		}
		// 是否为微信2.0
		if (isOk && this.data.choiceObj.isBankcard === 0) {
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
			idCardFace,
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
	}
});
