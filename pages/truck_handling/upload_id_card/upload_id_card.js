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
		isShowCodeInput: true,// 是否显示验证码输入框
		faceStatus: 1, // 1 未上传  2 识别中  3 识别失败  4识别成功
		backStatus: 1, // 1 未上传  2 识别中  3 识别失败  4识别成功
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		idCardStatus: 0,// 实名认证标识  默认0
		oldName: undefined,// 原始姓名
		oldIdNumber: undefined,// 原始身份证
		idCardFace: {
			ocrObject: {}
		},// 身份证正面
		idCardBack: {
			ocrObject: {}
		},// 身份证反面
		formData: {
			cardMobilePhone: '', // 电话号码
			verifyCode: '' // 验证码
		}, // 提交数据
		identifyingCode: '获取验证码',
		time: 9,// 倒计时
		isGetIdentifyingCoding: false // 获取验证码中
	},
	async onLoad (options) {
		this.setData({
			options
		});
		await this.getOrderInfo();
		// 查询是否欠款
		await util.getIsArrearage();
	},
	onShow () {
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
					oldName: truckIdCardFace.ocrObject.name,
					oldIdNumber: truckIdCardFace.ocrObject.idNumber,
					faceStatus: 4,
					idCardFace: truckIdCardFace
				});
				this.setData({
					available: this.validateData(false)
				});
			}
			let truckIdCardBack = wx.getStorageSync('truck-id-card-back');
			if (truckIdCardBack) {
				truckIdCardBack = JSON.parse(truckIdCardBack);
				this.setData({
					backStatus: 4,
					idCardBack: truckIdCardBack
				});
				this.setData({
					available: this.validateData(false)
				});
			}
		}
	},
	// 获取订单信息
	async getOrderInfo () {
		util.showLoading();
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '48'
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				orderInfo: result.data,
				idCardStatus: result.data.idCard.idCardStatus
			});
			console.log('orderInfo', result.data);
			// 获取车主身份信息
			let temp = this.data.orderInfo.ownerIdCard;
			if (this.data.orderInfo?.ownerIdCard?.cardMobilePhone) {
				this.data.formData.cardMobilePhone = this.data.orderInfo.ownerIdCard.cardMobilePhone;
				this.setData({
					mobilePhoneIsOk: true,
					formData: this.data.formData
				});
			}
			if (temp?.ownerIdCardTrueName) {
				let idCardBack = { ocrObject: {} };
				let idCardFace = { ocrObject: {} };
				idCardFace.fileUrl = temp.ownerIdCardPositiveUrl;
				idCardFace.ocrObject.name = temp.ownerIdCardTrueName;
				idCardFace.ocrObject.idNumber = temp.ownerIdCardNumber;
				idCardFace.ocrObject.address = temp.ownerIdCardAddress;
				idCardFace.ocrObject.sex = temp.ownerIdCardSex;
				idCardFace.ocrObject.birth = temp.ownerIdCardBirth;
				idCardBack.ocrObject.authority = temp.ownerIdCardAuthority;
				idCardBack.ocrObject.validDate = temp.ownerIdCardValidDate;
				idCardBack.fileUrl = temp.ownerIdCardNegativeUrl;
				this.setData({
					isShowCodeInput: !this.data.orderInfo.ownerIdCard.cardMobilePhone,
					oldName: idCardFace.ocrObject.name,
					oldIdNumber: idCardFace.ocrObject.idNumber,
					idCardFace,
					idCardBack,
					backStatus: 4,
					faceStatus: 4
				});
				this.setData({
					available: this.validateData(false)
				});
				wx.setStorageSync('truck-id-card-back', JSON.stringify(idCardBack));
				wx.setStorageSync('truck-id-card-face', JSON.stringify(idCardFace));
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 校验数据
	async validateData (isToast) {
		if (this.data.faceStatus !== 4 || this.data.backStatus !== 4) {
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
		return true;
	},
	async handleSaveData () {
		if (!this.validateData(true)) {
			return;
		}
		if (this.data.isCountdown) {
			util.showToastNoIcon(`请勿频繁提交，请${this.data.time}秒后再次尝试`);
			// 请勿频繁提交，请X秒后再次尝试”
			return;
		}
		if (this.data.isRequest) {
			return;
		}
		this.next();
	},
	async checkIdCardAndVehPlate () {
		// 校验货车身份证信息是否一致
		let data = {
			vehPlate: this.data.options.vehPlates,
			idNum: this.data.idCardFace.ocrObject.idNumber,
			platesColor: this.data.options.vehColor
		};
		const res = await util.getDataFromServersV2('consumer/order/checkIdCardAndVehPlate', data);
		if (res.code === 0) {
			this.next();
		} else {
			this.selectComponent('#popTipComp').show({
				type: 'shenfenyanzhifail',
				title: '车主身份不一致',
				btnCancel: '确认',
				refundStatus: true,
				content: '您上传的身份证与申办车牌不一致，请确认后重新上传！',
				bgColor: 'rgba(0,0,0, 0.6)'
			});
		}
	},
	// 下一步
	async next () {
		this.setData({
			isRequest: true
		});
		wx.uma.trackEvent('truck_for_id_card_next');
		// ocr返回的是 男女  接口是 1 2
		if (this.data.idCardFace.ocrObject.sex === '男') this.data.idCardFace.ocrObject.sex = 1;
		if (this.data.idCardFace.ocrObject.sex === '女') this.data.idCardFace.ocrObject.sex = 2;
		let haveChange = true;
		if (this.data.oldName === this.data.idCardFace.ocrObject.name && this.data.oldIdNumber === this.data.idCardFace.ocrObject.idNumber) haveChange = false;
		// 手机号没有更改不需要重新获取验证码
		let notVerifyCardPhone = this.data.formData.cardMobilePhone === this.data.orderInfo?.ownerIdCard?.cardMobilePhone ? 'true' : 'false';
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: '48', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			haveChange: haveChange, // 行驶证信息OCR结果有无修改过，默认false，修改过传true 【dataType包含4】
			changeAuditStatus: 0,// 修改不计入待审核
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
			ownerIdCardHaveChange: haveChange, // 车主身份证OCR结果是否被修改过，默认false，修改过传true 【dataType包含8}】
			ownerIdCardValidDate: this.data.idCardBack.ocrObject.validDate,
			ownerIdCardAddress: this.data.idCardFace.ocrObject.address,
			cardMobilePhone: this.data.formData.cardMobilePhone, // 车主实名手机号
			cardPhoneCode: this.data.formData.verifyCode, // 手机号验证码
			notVerifyCardPhone: true // true 时不需要验证码
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			// 校验通过
			const pages = getCurrentPages();
			const prevPage = pages[pages.length - 2];// 上一个页面
			prevPage.setData({
				isChangeIdCard: true // 重置状态
			});
			wx.navigateBack({
				delta: 1
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	failedCancelHandle () { // 身份验证失败 回调
		// 开始倒计时 10s
		this.startTimer();
	},
	// 上传图片
	uploadOcrFile (path) {
		const type = app.globalData.truckHandlingOCRType;
		if (type === 1) {
			this.setData({ faceStatus: 2 });
		} else {
			this.setData({ backStatus: 2 });
		}
		// 上传并识别图片
		util.uploadOcrFile(path, type, () => {
			if (type === 1) {
				this.setData({ faceStatus: 3 });
			} else {
				this.setData({ backStatus: 3 });
			}
			util.showToastNoIcon('文件服务器异常！');
		}, (res) => {
			try {
				if (res) {
					res = JSON.parse(res);
					if (res.code === 0) { // 识别成功
						app.globalData.truckHandlingOCRType = 0;
						try {
							if (type === 1) {
								this.setData({
									oldName: res.data[0].ocrObject.name,
									oldIdNumber: res.data[0].ocrObject.idNumber,
									faceStatus: 4,
									idCardFace: res.data[0]
								});
								wx.setStorageSync('truck-id-card-face', JSON.stringify(res.data[0]));
							} else {
								const endDate = res.data[0].ocrObject.validDate.split('-')[1].split('.').join('/');
								const isGreaterThanData = util.isGreaterThanData(endDate);// 身份证结束时间
								if (isGreaterThanData && !res.data[0].ocrObject.validDate.includes('长期')) {
									this.setData({
										faceStatus: 3,
										available: false
									});
									util.showToastNoIcon('证件已过期');
									return;
								}
								this.setData({
									backStatus: 4,
									idCardBack: res.data[0]
								});
								wx.setStorageSync('truck-id-card-back', JSON.stringify(res.data[0]));
							}
							this.setData({
								available: this.validateData(false)
							});
						} catch (e) {
							if (type === 1) {
								this.setData({ faceStatus: 3 });
							} else {
								this.setData({ backStatus: 3 });
							}
						}
					} else { // 识别失败
						if (type === 1) {
							this.setData({ faceStatus: 3 });
						} else {
							this.setData({ backStatus: 3 });
						}
					}
				} else { // 识别失败
					if (type === 1) {
						this.setData({ faceStatus: 3 });
					} else {
						this.setData({ backStatus: 3 });
					}
					util.showToastNoIcon('识别失败');
				}
			} catch (e) {
				if (type === 1) {
					this.setData({ faceStatus: 3 });
				} else {
					this.setData({ backStatus: 3 });
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
	// 输入框输入值做处理
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.key;
		let formData = this.data.formData;
		// 手机号
		if (key === 'cardMobilePhone') {
			this.setData({
				mobilePhoneIsOk: /^1[0-9]{10}$/.test(e.detail.value.substring(0, 11))
			});
		}
		if (key === 'cardMobilePhone' && e.detail.value.length > 11) {
			formData[key] = e.detail.value.substring(0, 11);
		} else if (key === 'verifyCode' && e.detail.value.length > 4) { // 验证码
			formData[key] = e.detail.value.substring(0, 4);
			this.setData({ formData });
		} else if (key === 'verifyCode' || key === 'cardMobilePhone') {
			formData[key] = e.detail.value;
			this.setData({ formData });
		} else {
			this.setData({
				[`idCardFace.ocrObject.${key}`]: e.detail.value
			});
		}
		if (e.detail.value.length === 4 && key === 'verifyCode') {
			wx.hideKeyboard({
				complete: res => {
					console.log('hideKeyboard res', res);
				}
			});
		}
		this.setData({
			available: this.validateData(false)
		});
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
			this.setData({ time: --this.data.time });
			if (this.data.time === 0) {
				clearInterval(timer);
				this.setData({
					time: 9,
					isCountdown: false
				});
			} else {
				this.setData({
					isCountdown: true,
					identifyingCode: `${this.data.time}s`
				});
			}
		}, 1000);
	}
});
