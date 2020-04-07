/**
 * @author 狂奔的蜗牛
 * @desc 选择支付方式
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		count: 0,// 计数,因网络图片老是404,所以做计数刷新处理
		idCardFace: {
			ocrObject: {}
		},// 身份证正面
		idCardBack: {
			ocrObject: {}
		},// 身份证反面
		type: '', // 判断小程序入口,控制身份证显示隐藏
		owner: '', // 车主本人
		firstVersionPic2: '', // 1.0身份证反面
		isFirstVersionPic2: false,// 1.0身份证反面 控制是否OCR
		userName: undefined,// 身份证正面 原始数据,用于与新数据比对(秒审)
		idNumber: undefined,// 身份证正面 原始数据,用于与新数据比对(秒审)
		available: false, // 按钮是否可点击
		isRequest: false// 是否请求中
	},
	onLoad (options) {
		this.getOrderInfo();
		this.setData({
			type: options.type
		});
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
			dataType: '68'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					owner: res.data.vehicle.owner
				});
				// 获取车主身份证信息
				if (app.globalData.isModifiedData) {
					// 修改资料
					let temp = this.data.orderInfo['ownerIdCard'];
					if (temp.idCardNegativeUrl) {
						let idCardFace = this.data.idCardFace;
						// 身份证反面
						let idCardBack = this.data.idCardBack;
						idCardBack.fileUrl = temp.ownerIdCardNegativeUrl;
						idCardBack.ocrObject.authority = temp.ownerIdCardAuthority;
						idCardBack.ocrObject.validDate = temp.ownerIdCardValidDate;
						// 身份证正面
						idCardFace.fileUrl = temp.ownerIdCardPositiveUrl;
						idCardFace.ocrObject.name = temp.ownerIdCardTrueName;
						idCardFace.ocrObject.birth = temp.ownerIdCardBirth;
						idCardFace.ocrObject.address = temp.ownerIdCardAddress;
						idCardFace.ocrObject.sex = temp.ownerIdCardSex === 1 ? '男' : '女';
						idCardFace.ocrObject.validDate = temp.ownerIdCardValidDate;
						idCardFace.ocrObject.idNumber = temp.ownerIdCardNumber;
						this.setData({
							idCardFace,
							idCardBack
						});
						this.setData({
							available: this.validateAvailable()
						});
						let that = this;
						if (app.globalData.firstVersionData && temp.ownerIdCardPositiveUrl) {
							that.setData({
								firstVersionPic2: temp.ownerIdCardNegativeUrl,
								isFirstVersionPic2: true
							});
							this.getNetworkImage(temp.ownerIdCardPositiveUrl,1);
						}
					}
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 下载网络图片
	getNetworkImage (path,type) {
		util.showLoading();
		let that = this;
		wx.getImageInfo({
			src: path,
			success: function (ret) {
				that.setData({
					count: 0
				});
				that.getOCRIdCard(ret.path, type);
			},
			fail: function (ret) {
				console.log(ret);
				console.log(that.data.count);
				// 多执行几次,使图片加载出来
				if (that.data.count <= 5) {
					that.setData({
						count: ++that.data.count
					});
					that.getNetworkImage(path,type);
				} else {
					that.setData({
						count: 0
					});
					util.hideLoading();
				}
			}
		});
	},
	// 1.0身份证OCR识别
	getOCRIdCard (path,type) {
		// 上传并识别图片
		util.uploadOcrFile(path, type, () => {
		}, (res) => {
			if (res) {
				res = JSON.parse(res);
				if (res.code === 0) { // 识别成功
					if (type === 1) {
						this.setData({
							idCardFace: res.data[0]
						});
					} else {
						this.setData({
							idCardBack: res.data[0]
						});
					}
				} else { // 识别失败
					util.showToastNoIcon(res.message);
				}
			} else { // 识别失败
				let obj = {};
				this.setData(obj);
				util.showToastNoIcon('身份证识别失败！');
			}
		}, () => {
			let that = this;
			if (this.data.firstVersionPic2 && this.data.isFirstVersionPic2) {
				this.setData({
					isFirstVersionPic2: false
				});
				this.getNetworkImage(this.data.firstVersionPic2,2);
			} else {
				util.hideLoading();
				this.setData({
					available: this.validateAvailable()
				});
			}
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
		if (!this.data.idCardFace.ocrObject.address ||
			!this.data.idCardBack.ocrObject.validDate ||
			!this.data.idCardBack.ocrObject.authority ||
			!this.data.idCardFace.ocrObject.birth ||
			!this.data.idCardFace.ocrObject.sex) {
			util.showToastNoIcon('部分信息识别失败,请重新上传身份证照片！');
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
		if (app.globalData.firstVersionData) {
			// 1.0数据转2.0
			params['upgradeToTwo'] = true; // 1.0数据转2.0
		}
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
