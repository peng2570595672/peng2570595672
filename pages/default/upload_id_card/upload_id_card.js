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
		topProgressBar: 3,	// 进度条展示的长度 ，再此页面的取值范围 [3,4),默认为3,保留一位小数
		topProgressBar1: 0,	// 存放上个页面传来进度条长度
		vehPlates: undefined,
		faceStatus: 1, // 1 未上传  4识别成功
		backStatus: 1, // 1 未上传  4识别成功
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
		tipObj: {
			type: '',
			title: '',
			content: ''
		}
	},
	async onLoad (options) {
		this.setData({
			vehPlates: options.vehPlates,
			topProgressBar: parseFloat(options.topProgressBar),
			topProgressBar1: parseFloat(options.topProgressBar)
		});
		await this.getOrderInfo();
		// 查询是否欠款
		await util.getIsArrearage();
	},
	onShow () {
		let idCardFace = wx.getStorageSync('passenger-car-id-card-face');
		if (idCardFace) {
			idCardFace = JSON.parse(idCardFace);
			this.setData({
				oldName: idCardFace.ocrObject.name,
				oldIdNumber: idCardFace.ocrObject.idNumber,
				faceStatus: 4,
				idCardFace
			});
			this.setData({
				available: this.validateData(false)
			});
		}
		let idCardBack = wx.getStorageSync('passenger-car-id-card-back');
		if (idCardBack) {
			idCardBack = JSON.parse(idCardBack);
			this.setData({
				backStatus: 4,
				idCardBack
			});
			this.setData({
				available: this.validateData(false)
			});
		}
		this.processBarSize();
	},
	// 获取订单信息
	async getOrderInfo () {
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
			// 获取实名信息
			let temp = this.data.orderInfo?.ownerIdCard;
			if (temp?.ownerIdCardTrueName) {
				let idCardBack = {ocrObject: {}};
				let idCardFace = {ocrObject: {}};
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
				wx.setStorageSync('passenger-car-id-card-back', JSON.stringify(idCardBack));
				wx.setStorageSync('passenger-car-id-card-face', JSON.stringify(idCardFace));
				this.processBarSize();
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 校验数据
	validateData (isToast) {
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
			if (isToast) util.showToastNoIcon('身份证号码不合法');
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
	// 下一步
	async next () {
		if (!this.validateData(true)) {
			return;
		}
		if (this.data.isRequest) {
			return;
		}
		this.setData({
			isRequest: true
		});
		let haveChange = true;
		if (this.data.oldName === this.data.idCardFace.ocrObject.name && this.data.oldIdNumber === this.data.idCardFace.ocrObject.idNumber) haveChange = false;
		wx.uma.trackEvent('id_card_next');
		// ocr返回的是 男女  接口是 1 2
		if (this.data.idCardFace.ocrObject.sex === '男') this.data.idCardFace.ocrObject.sex = 1;
		if (this.data.idCardFace.ocrObject.sex === '女') this.data.idCardFace.ocrObject.sex = 2;
		// 手机号没有更改不需要重新获取验证码
		// let notVerifyCardPhone = this.data.formData.cardMobilePhone === this.data.orderInfo.ownerIdCard.cardMobilePhone ? 'true' : 'false';
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: '48', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			changeAuditStatus: 0,// 修改不计入待审核
			haveChange: haveChange, // 行驶证信息OCR结果有无修改过，默认false，修改过传true 【dataType包含4】
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
			cardMobilePhone: app.globalData.handledByTelephone
			// cardMobilePhone: this.data.formData.cardMobilePhone, // 车主实名手机号
			// cardPhoneCode: this.data.formData.verifyCode, // 手机号验证码
			// notVerifyCardPhone: notVerifyCardPhone // true 时不需要验证码
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			if (app.globalData.orderInfo.obuCardType === 1) {
				this.userCarCheck(result.data);
			} else {
				const pages = getCurrentPages();
				const prevPage = pages[pages.length - 2];// 上一个页面
				prevPage.setData({
					isChangeIdCard: true // 重置状态
				});
				wx.navigateBack({
					delta: 1
				});
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 选择图片
	selectionPic (e) {
		let type = +e.currentTarget.dataset['type'];
		util.go(`/pages/default/shot_card/shot_card?type=${type}`);
	},
	// 输入框输入值做处理
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.key;
		let value = e.detail.value;
		if (key === 'name') {
			this.setData({
				'idCardFace.ocrObject.name': value
			});
			this.fangDou('',1000);
		} else if (key === 'idNumber') {
			this.setData({
				'idCardFace.ocrObject.idNumber': value
			});
			this.fangDou('',2000);
		}
	},
	fangDou (fn, time) {
		let that = this;
		return (function () {
			if (that.data.timeout) {
				clearTimeout(that.data.timeout);
			}
			that.data.timeout = setTimeout(() => {
				that.setData({
					available: that.validateData(true)
				});
			}, time);
		})();
	},
	// 用户信息查询 + 车牌唯一性校验
	async userCarCheck (obj) {
		const result = await util.getDataFromServersV2('consumer/etc/qtzl/queryUserAndCheckPlate', {
			orderId: obj.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			// result.data.result = false;
			// result.data.info = '核心提示【车牌贵GF9158已中国ETC实名在2019-08-2117:13:59,在统一平台贵州发行方办理有OBU,请联系渠道方处理】';
			let isOk2 = result.data.rcode && result.data.rcode !== 0 ? true : false;
			if (!result.data.result || isOk2) {
				if (!result.data.result) {
					let index = result.data.info.indexOf('【');
					let lastIndex = result.data.info.lastIndexOf('】');
					let info = result.data.info.slice(index + 1,lastIndex);
					this.setData({
						tipObj: {
							type: 'one',
							title: '车辆需注销重办',
							content: info
						}
					});
				} else {
					let flag = result.data.rmsg.indexOf('中国ETC服务小程序进行实名') || result.data.message.indexOf('中国ETC服务小程序进行实名');
					if (flag !== -1) {
						this.setData({
							tipObj: {
								type: 'one',
								title: '身份证需实名',
								content: '请用微信搜索中国ETC服务小程序，进入小程序登陆授权完成实名认证即可继续办理'
							}
						});
					} else {
						util.showToastNoIcon(result.message);
					}
				}
				this.selectComponent('#popTipComp').show();
				return;
			}
			const pages = getCurrentPages();
			const prevPage = pages[pages.length - 2];// 上一个页面
			prevPage.setData({
				isChangeIdCard: true // 重置状态
			});
			wx.navigateBack({
				delta: 1
			});
		} else {
			return util.showToastNoIcon(result.message);
		}
	},
	// 控制进度条的长短
	processBarSize () {
		if (this.data.faceStatus === 4 || this.data.backStatus === 4) {
			let flag = this.data.topProgressBar1;
			wx.setNavigationBarColor({
				backgroundColor: '#ECECEC',
				frontColor: '#000000'
			});
			this.setData({
				topProgressBar: this.data.faceStatus === 4 && this.data.backStatus === 4 ? flag + 0.3 : this.data.faceStatus === 4 || this.data.backStatus === 4 ? flag + 0.15 : flag
			});
		}
	}
});
