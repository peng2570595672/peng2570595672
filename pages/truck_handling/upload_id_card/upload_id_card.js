/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
// 倒计时计时器
let timer;
Page({
	data: {
		faceStatus: 1, // 1 未上传  2 识别中  3 识别失败  4识别成功
		backStatus: 1, // 1 未上传  2 识别中  3 识别失败  4识别成功
		identifyingCode: '获取验证码',
		verifyCode: '',
		time: 59,// 倒计时
		isGetIdentifyingCoding: false, // 获取验证码中
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		mobilePhone: app.globalData.userInfo.mobilePhone, // 用户登录手机号
		idCardStatus: 0,// 实名认证标识  默认0
		mobilePhoneIsOk: false,
		idCardFace: {
			ocrObject: {}
		},// 身份证正面
		idCardBack: {
			ocrObject: {}
		}// 身份证反面
	},
	onLoad (options) {
		app.globalData.orderInfo.orderId = '819230332799684608';
		this.getOrderInfo();
	},
	onShow () {
		// app.globalData.truckHandlingOCRType
		// 身份证正面
		let truck = wx.getStorageSync('truck-1');
		if (truck) {
			wx.removeStorageSync('truck-1');
			if (app.globalData.truckHandlingOCRType) this.uploadOcrFile(truck);
		}
		// 身份证反面
		truck = wx.getStorageSync('truck-2');
		if (truck) {
			wx.removeStorageSync('truck-2');
			if (app.globalData.truckHandlingOCRType) this.uploadOcrFile(truck);
		}
		if (!app.globalData.truckHandlingOCRType) {
			// 没通过上传
			let truckIdCardFace = wx.getStorageSync('truck-id-card-face');
			if (truckIdCardFace) {
				truckIdCardFace = JSON.parse(truckIdCardFace);
				this.setData({
					faceStatus: 4,
					idCardFace: truckIdCardFace
				});
				this.validateData(false);
			}
			let truckIdCardBack = wx.getStorageSync('truck-id-card-back');
			if (truckIdCardBack) {
				truckIdCardBack = JSON.parse(truckIdCardBack);
				this.setData({
					backStatus: 4,
					idCardBack: truckIdCardBack
				});
				this.validateData(false);
			}
		}
	},
	// 获取订单信息
	getOrderInfo () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '4'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					orderInfo: res.data
				});
				// 获取实名信息
				let temp = this.data.orderInfo.idCard;
				if (temp) {
					let idCardBack = {ocrObject: {}};
					let idCardFace = {ocrObject: {}};
					idCardFace.fileUrl = temp.idCardPositiveUrl;
					idCardFace.ocrObject.name = temp.idCardTrueName;
					idCardFace.ocrObject.idNumber = temp.idCardNumber;
					idCardFace.ocrObject.address = temp.idCardAddress;
					idCardFace.ocrObject.sex = temp.idCardSex;
					idCardFace.ocrObject.birth = temp.idCardBirth;
					idCardBack.ocrObject.authority = temp.idCardAuthority;
					idCardBack.ocrObject.validDate = temp.idCardValidDate;
					idCardBack.fileUrl = temp.idCardNegativeUrl;
					this.setData({
						idCardFace,
						idCardBack,
						backStatus: 4,
						faceStatus: 4,
						idCardStatus: temp.idCardStatus
					});
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 校验数据
	validateData (isToast) {
		if (!this.data.idCardBack.fileUrl || !this.data.idCardFace.fileUrl) {
			if (isToast) util.showToastNoIcon('请上传身份证！');
			return false;
		}
		if (!this.data.idCardFace.ocrObject.name) {
			if (isToast) util.showToastNoIcon('姓名不能为空！');
			return false;
		}
		if (!this.data.idCardFace.ocrObject.idNumber) {
			if (isToast) util.showToastNoIcon('身份证号不能为空！');
			return false;
		}
		if (!/^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$|^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X)$/.test(this.data.idCardFace.ocrObject.idNumber)) {
			if (isToast) util.showToastNoIcon('身份证号格式不正确！');
			return false;
		}
		if (!this.data.idCardBack.ocrObject.validDate || !this.data.idCardFace.ocrObject.address ||
			!this.data.idCardBack.ocrObject.authority || !this.data.idCardFace.ocrObject.birth ||
			!this.data.idCardFace.ocrObject.sex) {
			if (isToast) util.showToastNoIcon('部分信息识别失败,请重新上传身份证照片！');
			return false;
		}
		// if (!this.data.mobilePhone) {
		// 	if (isToast) util.showToastNoIcon('请输入联系方式！');
		// 	return false;
		// }
		return true;
	},
	// 下一步
	next () {
		if (!this.validateData(true)) {
			return;
		}
		if (this.data.isRequest) {
			return;
		}
		this.setData({
			isRequest: true
		});
		// ocr返回的是 男女  接口是 1 2
		if (this.data.idCardFace.ocrObject.sex === '男') this.data.idCardFace.ocrObject.sex = 1;
		if (this.data.idCardFace.ocrObject.sex === '女') this.data.idCardFace.ocrObject.sex = 2;
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: '48', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			idCardStatus: this.data.idCardStatus,
			idCardValidDate: this.data.idCardBack.ocrObject.validDate, // 有效期 格式为：2007.10.09-2027.10.09 【dataType包含4】
			idCardAddress: this.data.idCardFace.ocrObject.address,// 地址 【dataType包含4】
			idCardAuthority: this.data.idCardBack.ocrObject.authority,// 发证机关 【dataType包含4】
			idCardTrueName: this.data.idCardFace.ocrObject.name, // 实名认证姓名 【dataType包含4】
			idCardBirth: this.data.idCardFace.ocrObject.birth, // 出生日期 【dataType包含4】
			idCardSex: this.data.idCardFace.ocrObject.sex, // 实名认证性别 【dataType包含4】
			idCardNumber: this.data.idCardFace.ocrObject.idNumber, // 实名认证身份证号 【dataType包含4】
			idCardPositiveUrl: this.data.idCardFace.fileUrl, // 实名身份证正面地址 【dataType包含4】
			idCardNegativeUrl: this.data.idCardBack.fileUrl,// 实名身份证反面地址 【dataType包含4】
			ownerIdCardTrueName: this.data.idCardFace.ocrObject.name, // 实名认证姓名 【dataType包含8】
			ownerIdCardNumber: this.data.idCardFace.ocrObject.idNumber, // 实名认证身份证号 【dataType包含8】
			ownerIdCardPositiveUrl: this.data.idCardFace.fileUrl, // 实名身份证正面地址 【dataType包含8】
			ownerIdCardNegativeUrl: this.data.idCardBack.fileUrl, // 实名身份证反面地址 【dataType包含8】
			ownerIdCardSex: this.data.idCardFace.ocrObject.sex, // 实名认证性别 【dataType包含8】
			ownerIdCardAuthority: this.data.idCardBack.ocrObject.authority, // 发证机关 【dataType包含8】
			ownerIdCardBirth: this.data.idCardFace.ocrObject.birth, // 出生日期 【dataType包含8】
			ownerIdCardHaveChange: false, // 车主身份证OCR结果是否被修改过，默认false，修改过传true 【dataType包含8}】
			ownerIdCardValidDate: this.data.idCardBack.ocrObject.validDate,
			ownerIdCardAddress: this.data.idCardFace.ocrObject.address
		};
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				util.go(`/pages/default/upload_vehicle_information/upload_vehicle_information`);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				isRequest: false
			});
		});
	},
	// 上传图片
	uploadOcrFile (path) {
		const type = app.globalData.truckHandlingOCRType;
		if (type === 1) {
			this.setData({faceStatus: 2});
		} else {
			this.setData({backStatus: 2});
		}
		// 上传并识别图片
		util.uploadOcrFile(path, type, () => {
			if (type === 1) {
				this.setData({faceStatus: 3});
			} else {
				this.setData({backStatus: 3});
			}
			util.showToastNoIcon('文件服务器异常！');
		}, (res) => {
			try {
				if (res) {
					res = JSON.parse(res);
					if (res.code === 0) { // 识别成功
						app.globalData.truckHandlingOCRTyp = 0;
						if (type === 1) {
							this.setData({
								faceStatus: 4,
								idCardFace: res.data[0]
							});
							wx.setStorageSync('truck-id-card-face', JSON.stringify(res.data[0]));
						} else {
							const endDate = res.data[0].ocrObject.validDate.split('-')[1].split('.').join('/');
							const isGreaterThanData = util.isGreaterThanData(endDate);// 身份证结束时间
							if (isGreaterThanData) {
								this.setData({faceStatus: 3});
								util.showToastNoIcon('证件已过期');
								return;
							}
							this.setData({
								backStatus: 4,
								idCardBack: res.data[0]
							});
							wx.setStorageSync('truck-id-card-back', JSON.stringify(res.data[0]));
						}
					} else { // 识别失败
						if (type === 1) {
							this.setData({faceStatus: 3});
						} else {
							this.setData({backStatus: 3});
						}
					}
				} else { // 识别失败
					if (type === 1) {
						this.setData({faceStatus: 3});
					} else {
						this.setData({backStatus: 3});
					}
					util.showToastNoIcon('识别失败');
				}
			} catch (e) {
				if (type === 1) {
					this.setData({faceStatus: 3});
				} else {
					this.setData({backStatus: 3});
				}
				util.showToastNoIcon('文件服务器异常！');
			}
		}, () => {
		});
	},
	// 选择图片
	selectionPic (e) {
		let type = +e.currentTarget.dataset['type'];
		// 识别中禁止修改
		if ((type === 1 && this.data.faceStatus === 2) || (type === 2 && this.data.backStatus === 2)) return;
		util.go(`/pages/truck_handling/shot_card/shot_card?type=${type}&pathUrl=${type === 1 ? this.data.idCardFace.fileUrl : this.data.idCardBack.fileUrl}`);
	},
	// 倒计时
	startTimer () {
		// 设置状态
		this.setData({
			identifyingCode: `${this.data.time}s`
		});
		// 清倒计时
		clearInterval(timer);
		timer = setInterval(() => {
			this.setData({time: --this.data.time});
			if (this.data.time === 0) {
				clearInterval(timer);
				this.setData({
					time: 59,
					isGetIdentifyingCoding: false,
					identifyingCode: '重新获取'
				});
			} else {
				this.setData({
					identifyingCode: `${this.data.time}s`
				});
			}
		}, 1000);
	},
	// 发送短信验证码
	sendVerifyCode () {
		if (this.data.isGetIdentifyingCoding) return;
		// 如果在倒计时，直接不处理
		if (!this.data.mobilePhone) {
			util.showToastNoIcon('请输入手机号');
			return;
		} else if (!/^1[0-9]{10}$/.test(this.data.mobilePhone)) {
			util.showToastNoIcon('手机号输入不合法');
			return;
		}
		this.setData({
			isGetIdentifyingCoding: true
		});
		util.showLoading({
			title: '请求中...'
		});
		util.getDataFromServer('consumer/order/send-receive-phone-verification-code', {
			receivePhone: this.data.mobilePhone // 手机号
		}, () => {
			util.hideLoading();
		}, (res) => {
			if (res.code === 0) {
				this.startTimer();
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		}, 'GET');
	},
	// 输入框输入值做处理
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.key;
		let value = '';
		// 手机号
		if (key === 'mobilePhone') {
			this.setData({
				mobilePhoneIsOk: /^1[0-9]{10}$/.test(e.detail.value.substring(0, 11))
			});
		}
		if (key === 'mobilePhone' && e.detail.value.length > 11) {
			value = e.detail.value.substring(0, 11);
		} else if (key === 'verifyCode' && e.detail.value.length > 4) { // 验证码
			value = e.detail.value.substring(0, 4);
		} else {
			value = e.detail.value;
		}
		this.setData({
			[`${key}`]: value
		});
		this.setData({
			available: this.validateData()
		});
	},
});
