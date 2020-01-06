/**
 * @author 狂奔的蜗牛
 * @desc 选择支付方式
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
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
		// 身份证正面
		let idCardFace = wx.getStorageSync('id_card_face');
		if (idCardFace) {
			idCardFace = JSON.parse(idCardFace);
			this.setData({
				idCardFace: idCardFace.data[0]
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
	// 拍照 银行卡
	onClickShotBankCardHandle (e) {
		let type = e.currentTarget.dataset.type;
		util.go(`/pages/default/shot_bank_card/shot_bank_card?type=${type}`);
	},
	// 签约
	next () {
		console.log(this.data.orderInfo);
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		this.setData({
			isRequest: true,
			available: false
		});
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: '4', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			idCardStatus: this.data.orderInfo['idCard'].idCardStatus,
			idCardTrueName: this.data.idCardFace.ocrObject.name, // 实名认证姓名 【dataType包含4】
			idCardNumber: this.data.idCardFace.ocrObject.idNumber, // 实名认证身份证号 【dataType包含4】
			idCardPositiveUrl: this.data.idCardFace.fileUrl, // 实名身份证正面地址 【dataType包含4】
			idCardNegativeUrl: this.data.idCardBack.fileUrl // 实名身份证反面地址 【dataType包含4】
		};
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
		let isOk = true;
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
	}
});
