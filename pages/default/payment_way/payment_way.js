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
		count: 0,// 计数,因网络图片老是404,所以做计数刷新处理
		showChoiceBank: true, // 选择套餐
		choiceSetMeal: undefined, // 选择支付方式逐渐
		choiceObj: undefined, // 选择的套餐
		firstVersionPic2: '', // 1.0身份证反面
		isFirstVersionPic2: false,// 1.0身份证反面 控制是否OCR
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
		isMembershipCoupon: false,// 是否是会员券进入办理
		isSalesmanCrowdsourcing: false,// 是否是业务员扫码办理用户
		orderInfo: undefined // 订单信息
	},
	onLoad (options) {
		app.globalData.isSalesmanOrder = false;// 非业务员订单
		app.globalData.isModifiedData = false; // 非修改资料
		if (options.type && options.type === 'payment_mode') {
			this.setData({
				isSalesmanCrowdsourcing: true
			});
		}
		if (app.globalData.firstVersionData || this.data.isSalesmanCrowdsourcing) {
			this.getProductOrderInfo();
		}
		this.getOrderInfo();
		// app.globalData.orderInfo.orderId = '658608879176781824';
		// app.globalData.userInfo.accessToken = 'NjU3NjE0MDE0NjQ1MjcyNTc2OjEyMzQ1Njc4OTAxMjM0NTY3ODo1N2MzNDExYzFiZDY0NzMzYTNlNzMzNWI0YjE4MDg2OQ==';
	},
	// 根据订单id获取套餐信息 1.0
	getProductOrderInfo () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-product-by-order-id', {
			orderId: app.globalData.orderInfo.orderId
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					choiceObj: res.data
				});
				this.setData({
					available: this.validateAvailable()
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
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
						this.setData({
							available: this.validateAvailable()
						});
					} else {
						this.setData({
							idCardBack: res.data[0]
						});
						this.setData({
							available: this.validateAvailable()
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
				this.setData({
					available: this.validateAvailable()
				});
			} else {
				util.hideLoading();
				this.setData({
					available: this.validateAvailable()
				});
			}
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
	// 获取订单信息
	getOrderInfo () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '1345'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					orderInfo: res.data
				});
				let arr = [1, 3, 4, 5, 6, 9, 12, 14, 17];// 推广类型
				if (arr.includes(res.data.base.promoterType)) {
					// 会员券进入办理  业务员推广进入  高速通行进入  众包 面对面  微信九宫格
					app.globalData.isSalesmanPromotion = true;
					this.setData({
						isMembershipCoupon: true
					});
					app.globalData.salesmanMerchant = res.data.product.shopId && res.data.product.shopId !== 0 ? res.data.product.shopId : undefined;
					if (res.data.base.thirdGeneralizeNo) {
						// if (res.data.base.thirdGeneralizeNo.includes('ftf')) {
						// 	let ftf = res.data.base.thirdGeneralizeNo.split('-');
						// 	app.globalData.isSalesmanPromotion = false;
						// 	app.globalData.otherPlatformsServiceProvidersId = res.data.product.shopId;
						// 	[`app.globalData.${ftf[1]}`] = true;
						// }
						if (res.data.base.thirdGeneralizeNo.indexOf('isFaceToFace') !== -1) {
							app.globalData.isSalesmanPromotion = false;
							app.globalData.faceToFacePromotionId = res.data.base.promoterId;
							app.globalData.otherPlatformsServiceProvidersId = res.data.product.shopId && res.data.product.shopId !== 0 ? res.data.product.shopId : undefined;
						}
						if (res.data.base.thirdGeneralizeNo === 'isFaceToFaceCCB') {
							app.globalData.isFaceToFaceCCB = true;
						} else if (res.data.base.thirdGeneralizeNo === 'isFaceToFaceICBC') {
							app.globalData.isFaceToFaceICBC = true;
						} else if (res.data.base.thirdGeneralizeNo === 'isFaceToFaceWeChat') {
							app.globalData.isFaceToFaceWeChat = true;
						}
					}
				} else {
					app.globalData.isSalesmanPromotion = false;
				}
				// 获取实名信息
				let temp = this.data.orderInfo['idCard'];
				if (temp.idCardNegativeUrl) {
					let idCardFace = this.data.idCardFace;
					// 身份证反面
					let idCardBack = this.data.idCardBack;
					idCardBack.fileUrl = temp.idCardNegativeUrl;
					idCardBack.ocrObject.authority = temp.idCardAuthority;
					idCardBack.ocrObject.validDate = temp.idCardValidDate;
					// 身份证正面
					idCardFace.fileUrl = temp.idCardPositiveUrl;
					idCardFace.ocrObject.name = temp.idCardTrueName;
					idCardFace.ocrObject.birth = temp.idCardBirth;
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
				// 获取银行卡信息
				let bank = this.data.orderInfo['bankAccount'];
				if (bank && bank.bankAccountNo) {
					let bankCardIdentifyResult = this.data.bankCardIdentifyResult;
					bankCardIdentifyResult.ocrObject.cardNo = bank.bankAccountNo;
					bankCardIdentifyResult.ocrObject.cardName = bank.bankName;
					bankCardIdentifyResult.ocrObject.bankCardType = bank.cardType === 1 ? '借记卡' : '贷记卡';
					bankCardIdentifyResult.fileUrl = bank.bankCardUrl;
					this.setData({
						bankCardIdentifyResult
					});
				}
				let that = this;
				if (app.globalData.firstVersionData) {
					that.setData({
						[`choiceObj.areaCode`]: res.data.product.areaCode
					});
				}
				if (app.globalData.firstVersionData && temp.idCardPositiveUrl) {
					that.setData({
						firstVersionPic2: temp.idCardNegativeUrl,
						isFirstVersionPic2: true
					});
					util.showLoading();
					this.getNetworkImage(temp.idCardPositiveUrl,1);
				}
				if (this.data.isSalesmanCrowdsourcing) {
					this.setData({
						available: this.validateAvailable()
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
	// ETC服务状态提醒（A）
	subscribe () {
		// 判断版本，兼容处理
		let result = util.compareVersion(app.globalData.SDKVersion, '2.8.2');
		if (result >= 0) {
			util.showLoading({
				title: '加载中...'
			});
			wx.requestSubscribeMessage({
				tmplIds: ['rWHTLYmUdcuYw-wKU0QUyM7H0t-adDKeu193RjILL0M'],
				success: (res) => {
					mta.Event.stat('032',{});
					wx.hideLoading();
					if (res.errMsg === 'requestSubscribeMessage:ok') {
						let keys = Object.keys(res);
						// 是否存在部分未允许的订阅消息
						let isReject = false;
						for (let key of keys) {
							if (res[key] === 'reject') {
								isReject = true;
								break;
							}
						}
						// 有未允许的订阅消息
						if (isReject) {
							util.alert({
								content: '检查到当前订阅消息未授权接收，请授权',
								showCancel: true,
								confirmText: '授权',
								confirm: () => {
									wx.openSetting({
										success: (res) => {
										},
										fail: () => {
											util.showToastNoIcon('打开设置界面失败，请重试！');
										}
									});
								},
								cancel: () => { // 点击取消按钮
									this.signAContract();
								}
							});
						} else {
							this.signAContract();
						}
					}
				},
				fail: (res) => {
					wx.hideLoading();
					// 不是点击的取消按钮
					if (res.errMsg === 'requestSubscribeMessage:fail cancel') {
						this.signAContract();
					} else {
						util.alert({
							content: '调起订阅消息失败，是否前往"设置" -> "订阅消息"进行订阅？',
							showCancel: true,
							confirmText: '打开设置',
							confirm: () => {
								wx.openSetting({
									success: (res) => {
									},
									fail: () => {
										util.showToastNoIcon('打开设置界面失败，请重试！');
									}
								});
							},
							cancel: () => {
								this.signAContract();
							}
						});
					}
				}
			});
		} else {
			util.alert({
				title: '微信更新提示',
				content: '检测到当前微信版本过低，可能导致部分功能无法使用；可前往微信“我>设置>关于微信>版本更新”进行升级',
				confirmText: '继续使用',
				showCancel: true,
				confirm: () => {
					this.signAContract();
				}
			});
		}
	},
	// 签约
	next () {
		if (!this.data.available || this.data.isRequest) {
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
		// 统计点击事件
		mta.Event.stat('028',{});
		// 订阅消息
		this.subscribe();
	},
	// 提交签约数据
	signAContract () {
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
			shopId: app.globalData.miniProgramServiceProvidersId, // 商户id
			dataType: '348', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			shopProductId: this.data.choiceObj.shopProductId,
			areaCode: this.data.choiceObj.areaCode || 0,
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
		if (app.globalData.isServiceProvidersPackage && app.globalData.otherPlatformsServiceProvidersId) {
			// 存在该服务商且有该服务商套餐 :使用该服务商id,否则,使用小程序服务商id
			params['shopId'] = app.globalData.otherPlatformsServiceProvidersId;
		}
		if (app.globalData.firstVersionData) {
			params['upgradeToTwo'] = true; // 1.0数据转2.0
		}
		// 银行卡 3.0
		if (this.data.choiceObj.productProcess === 3) {
			params.dataType = '3458';
			params['bankAccountNo'] = this.data.bankCardIdentifyResult.ocrObject.cardNo; // 银行卡号 【dataType包含5】
			params['bankCardUrl'] = this.data.bankCardIdentifyResult.fileUrl; // 银行卡图片地址 【dataType包含5】
			params['bankName'] = this.data.bankCardIdentifyResult.ocrObject.cardName; // 银行名称 【dataType包含5】
			params['bankAccountType'] = 1; // 账户类型 1-一类户 2-二类户 3-三类户 【dataType包含5】允许值: 1, 2, 3
			params['bankCardType'] = this.data.bankCardIdentifyResult.ocrObject.cardType === '借记卡' ? 1 : 2; // 银行卡种 1-借记卡 2-贷记卡 【dataType包含5】允许值: 1, 2;
		}
		if (app.globalData.salesmanMerchant) {
			params['shopId'] = app.globalData.salesmanMerchant;
		}
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				app.globalData.isSecondSigning = false;
				app.globalData.isSecondSigningInformationPerfect = false;
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
		app.globalData.orderInfo.orderId = '';
		if (this.data.isMembershipCoupon) {
			app.globalData.salesmanMerchant = undefined;
		}
		if (app.globalData.faceToFacePromotionId) {
			app.globalData.otherPlatformsServiceProvidersId = undefined;
		}
		app.globalData.isFaceToFaceWeChat = false;
		app.globalData.isFaceToFaceCCB = false;
		app.globalData.isFaceToFaceICBC = false;
		app.globalData.isSalesmanPromotion = false;
		app.globalData.faceToFacePromotionId = undefined;
		// 统计点击事件
		mta.Event.stat('029',{});
		// 加上存储,控制签约后的返回不提示
		// if (wx.getStorageSync('return_to_prompt')) {
		// 	util.alert({
		// 		content: '您还未领取免费ETC设备，确认取消吗？',
		// 		showCancel: true,
		// 		cancelText: '取消办理',
		// 		confirmText: '手误了',
		// 		confirm: () => {
		// 			util.go('/pages/default/payment_way/payment_way');
		// 		},
		// 		cancel: () => {
		// 			wx.removeStorageSync('return_to_prompt');
		// 			if (app.globalData.orderInfo.orderId) {
		// 				this.cancelOrder();
		// 			}
		// 		}
		// 	});
		// }
	}
});
