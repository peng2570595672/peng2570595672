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
		type: '', // 判断小程序入口,控制身份证显示隐藏
		owner: '', // 车主本人
		userName: undefined,// 身份证正面 原始数据,用于与新数据比对(秒审)
		idNumber: undefined,// 身份证正面 原始数据,用于与新数据比对(秒审)
		available: false, // 按钮是否可点击
		isRequest: false// 是否请求中
	},
	onLoad (options) {
		this.setData({
			type: options.type
		});
		this.getOrderInfo();
		},
	onShow () {
		if (this.data.type !== 'normal_process') {
			this.getOwnerIdCard();
		}
	},
	// 获取订单信息
	getOrderInfo () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '6'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					owner: res.data.vehicle.owner
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 获取缓存身份证
	getOwnerIdCard () {
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
	onClickShotBankCardHandle (e) {
		this.setData({
			type: ''
		});
		let type = e.currentTarget.dataset.type;
		util.go(`/pages/default/shot_bank_card/shot_bank_card?type=${type}`);
	},
	// 签约
	next () {
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		if (this.data.owner !== this.data.idCardFace.ocrObject.name) {
			util.showToastNoIcon('请上传车主本人身份证！');
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
			dataType: '8', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 1, // 订单资料是否已完善 1-是，0-否
			ownerIdCardTrueName: this.data.idCardFace.ocrObject.name, // 实名认证姓名 【dataType包含8】
			ownerIdCardNumber: this.data.idCardFace.ocrObject.idNumber, // 实名认证身份证号 【dataType包含8】
			ownerIdCardPositiveUrl: this.data.idCardFace.fileUrl, // 实名身份证正面地址 【dataType包含8】
			ownerIdCardNegativeUrl: this.data.idCardBack.fileUrl, // 实名身份证反面地址 【dataType包含8】
			ownerIdCardValidDate: this.data.idCardBack.ocrObject.validDate,
			ownerIdCardSex: this.data.idCardFace.ocrObject.sex === '男' ? 1 : 2, // 实名认证性别 【dataType包含8】
			ownerIdCardAuthority: this.data.idCardBack.ocrObject.authority, // 发证机关 【dataType包含8】
			ownerIdCardBirth: this.data.idCardFace.ocrObject.birth, // 出生日期 【dataType包含8】
			ownerIdCardHaveChange: IdCardHaveChange, // 车主身份证OCR结果是否被修改过，默认false，修改过传true 【dataType包含8}】
			ownerIdCardAddress: this.data.idCardFace.ocrObject.address
		};
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				util.go('/pages/default/processing_progress/processing_progress?type=main_process');
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
