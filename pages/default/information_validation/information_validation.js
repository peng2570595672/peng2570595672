/**
 * @author 狂奔的蜗牛
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		count: 0,// 计数,因网络图片老是404,所以做计数刷新处理
		opened: false, // 是否展开更多信息
		current: 0, // 当前轮播图索引
		firstVersionPic4: '',
		isFirstVersionPic4: false,
		drivingLicenseFace: {
			ocrObject: {}
		}, // 行驶证正面
		oldDrivingLicenseFace: {
			ocrObject: {}
		}, // 行驶证正面 原始数据,用于与新数据比对(秒审)
		oldDrivingLicenseBack: {
			ocrObject: {}
		}, // 行驶证反面 原始数据,用于与新数据比对(秒审)
		drivingLicenseBack: {
			ocrObject: {}
		}, // 行驶证反面
		carHead45: {}, // 车头照
		oldCarHead45: {}, // 车头照 原始数据,用于与新数据比对(秒审)
		personIndex: 0, // 选择框当前选中索引
		oldPersonIndex: 0, // 选择框当前选中索引 原始数据,用于与新数据比对(秒审)
		personsArr: [2, 3, 4, 5, 6, 7, 8, 9], // 核载人数选择框
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		isShowTextarea: true,// 是否显示textarea
		productInfo: undefined,// 套餐信息
		orderInfo: undefined // 订单信息
	},
	onLoad () {
		wx.removeStorageSync('return_photo_recognition_of_driving_license_type');
		let returnType = wx.getStorageSync('information_validation');
		if (returnType) {
			this.setData({
				isShowTextarea: false
			});
			this.selectComponent('#notFinishedOrder').show();
			wx.removeStorageSync('information_validation');
		}
		// 行驶证正面
		let drivingLicenseFace = wx.getStorageSync('driving_license_face');
		// 行驶证反面
		let drivingLicenseBack = wx.getStorageSync('driving_license_back');
		if (drivingLicenseFace && drivingLicenseBack) {
			drivingLicenseFace = JSON.parse(drivingLicenseFace);
			let oldDrivingLicenseFace = JSON.parse(wx.getStorageSync('driving_license_face'));
			let oldDrivingLicenseBack = JSON.parse(wx.getStorageSync('driving_license_back'));
			drivingLicenseBack = JSON.parse(drivingLicenseBack);
			// 车头照
			let carHead45 = wx.getStorageSync('car_head_45');
			let oldCarHead45 = wx.getStorageSync('car_head_45');
			if (carHead45) {
				oldCarHead45 = JSON.parse(wx.getStorageSync('car_head_45'));
				carHead45 = JSON.parse(carHead45);
			}
			this.setData({
				drivingLicenseFace,
				oldDrivingLicenseFace,
				oldDrivingLicenseBack,
				drivingLicenseBack,
				carHead45,
				oldCarHead45
			});
			// 回显人数
			let personCount = this.data.drivingLicenseBack.ocrObject.personsCapacity;
			if (personCount) {
				try {
					personCount = parseInt(personCount);
					let index = this.data.personsArr.indexOf(personCount);
					this.setData({
						personIndex: index !== -1 ? index : 3,
						oldPersonIndex: index !== -1 ? index : 3
					});
				} catch (e) {
				}
			}
			// 加载订单信息 有缓存,不需要查行驶证
			this.getOrderInfo(true);
			this.getProductOrderInfo();
		} else {
			// 加载订单信息  没有缓存,需要查行驶证
			this.getOrderInfo(false);
			this.getProductOrderInfo();
		}
	},
	onShow () {
		wx.removeStorageSync('return_photo_recognition_of_driving_license');
		let returnType = wx.getStorageSync('information_validation');
		if (returnType) {
			this.setData({
				isShowTextarea: false
			});
			this.selectComponent('#notFinishedOrder').show();
			wx.removeStorageSync('information_validation');
		}
	},
	// 根据订单id获取套餐信息
	getProductOrderInfo () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-product-by-order-id', {
			orderId: app.globalData.orderInfo.orderId
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					productInfo: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 获取订单信息
	getOrderInfo (isCache) {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: isCache ? '14' : '1467'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					orderInfo: res.data,
					available: true // 下一步按钮可用
				});
				if (!isCache) {
					let that = this;
					if (res.data.vehicle) { // 是否有行驶证
						let index = this.data.personsArr.findIndex((value) => value === parseInt(res.data.vehicle.personsCapacity));
						this.setData({
							[`drivingLicenseBack.ocrObject`]: res.data.vehicle,
							[`drivingLicenseFace.ocrObject`]: res.data.vehicle,
							[`drivingLicenseFace.ocrObject.numberPlates`]: res.data.vehicle.vehPlates,
							[`drivingLicenseBack.ocrObject.numberPlates`]: res.data.vehicle.vehPlates,
							personIndex: index,
							oldPersonIndex: index,
							[`drivingLicenseFace.ocrObject.address`]: res.data.vehicle.ownerAddress,
							[`drivingLicenseFace.ocrObject.resgisterDate`]: res.data.vehicle.registerDate,
							[`drivingLicenseFace.fileUrl`]: res.data.vehicle.licenseMainPage,
							[`drivingLicenseBack.fileUrl`]: res.data.vehicle.licenseVicePage
						});
						this.setData({
							oldDrivingLicenseFace: this.data.drivingLicenseFace,
							oldDrivingLicenseBack: this.data.drivingLicenseBack
						});
						if (res.data.headstock) {
							this.setData({
								carHead45: res.data.headstock,
								oldCarHead45: res.data.headstock
							});
							if (app.globalData.firstVersionData) {
								that.getNetworkImage(res.data.headstock.fileUrl, 0);
							}
							wx.setStorageSync('car_head_45', JSON.stringify(res.data.headstock));
						}
						wx.setStorageSync('driving_license_face', JSON.stringify(this.data.drivingLicenseFace));
						wx.setStorageSync('driving_license_back', JSON.stringify(this.data.drivingLicenseBack));
						if (app.globalData.firstVersionData) {
							that.setData({
								firstVersionPic4: res.data.vehicle.licenseVicePage,
								isFirstVersionPic4: true
							});
							that.getNetworkImage(res.data.vehicle.licenseMainPage, 3);
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
				if (type === 0) {
					that.uploadCarHeadPic(ret.path);
				} else {
					that.getOCRVehicleLicense(ret.path, type);
				}
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
	//  展开和关闭切换
	onClickToggleOpenOrCloseHandle () {
		this.setData({
			opened: !this.data.opened
		});
	},
	// 轮播图当前页改变
	onChangeHandle (e) {
		this.setData({
			current: e.detail.current
		});
	},
	// 提交信息
	onClickComfirmHandle () {
		// 统计点击事件
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		mta.Event.stat('035',{});
		this.subscribe();
	},
	// ETC申办审核结果通知、ETC发货提示
	subscribe () {
		// 判断版本，兼容处理
		let result = util.compareVersion(app.globalData.SDKVersion, '2.8.2');
		if (result >= 0) {
			util.showLoading({
				title: '加载中...'
			});
			wx.requestSubscribeMessage({
				tmplIds: ['aHsjeWaJ0RRU08Uc-OeLs2OyxLxBd_ta3zweXloC66U','K6gUmq_RSjfR1Hm_F8ORAzlpZZDVaDhuRDE6JoVvsuo'],
				success: (res) => {
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
									this.comfirmHandle();
								}
							});
						} else {
							this.comfirmHandle();
						}
					}
				},
				fail: (res) => {
					wx.hideLoading();
					// 不是点击的取消按钮
					if (res.errMsg === 'requestSubscribeMessage:fail cancel') {
						this.comfirmHandle();
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
								this.comfirmHandle();
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
					this.comfirmHandle();
				}
			});
		}
	},
	comfirmHandle () {
		// 比对车牌颜色和车牌位数是否一致   新老数据做对比,判断是否进行面审
		// 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
		let face = this.data.drivingLicenseFace.ocrObject;
		let oldFace = this.data.oldDrivingLicenseFace.ocrObject;
		let carHead45 = this.data.carHead45;
		let oldCarHead45 = this.data.oldCarHead45;
		let back = this.data.drivingLicenseBack.ocrObject;
		let oldBack = this.data.oldDrivingLicenseBack.ocrObject;
		let backValue;
		let oldBackValue;
		let faceValue;
		let oldFaceValue;
		let carHead45Value;
		let oldCarHead45Value;
		let haveChange = true;
		for (let key in back) { backValue += back[key]; }
		for (let key in oldBack) { oldBackValue += oldBack[key]; }
		for (let key in face) { faceValue += face[key]; }
		for (let key in oldFace) { oldFaceValue += oldFace[key]; }
		for (let key in carHead45) { carHead45Value += carHead45[key]; }
		for (let key in oldCarHead45) { oldCarHead45Value += oldCarHead45[key]; }
		if (backValue === oldBackValue && faceValue === oldFaceValue && carHead45Value === oldCarHead45Value) {
			haveChange = false;
		}
		// 比对之前输入车牌和当前行驶证车牌是否一致
		if (face.numberPlates !== this.data.orderInfo['base'].vehPlates.trim()) {
			util.showToastNoIcon(`行驶证车牌${face.numberPlates}与下单时车牌${this.data.orderInfo['base'].vehPlates.trim()}不一致，请检查！`);
			return;
		}
		let isOk = true;
		if (face.numberPlates.length === 7) {
			isOk = this.data.orderInfo['base'].vehColor === 0 || this.data.orderInfo['base'].vehColor === 1;
		} else {
			isOk = this.data.orderInfo['base'].vehColor === 4;
		}
		if (!isOk) {
			let color = this.data.orderInfo['base'].vehColor === 1 ? '黄色' : this.data.orderInfo['base'].vehColor === 4 ? '渐变绿色' : '蓝色';
			util.showToastNoIcon(`车牌格式与下单时车牌颜色（${color}）不符，请检查！`);
			return;
		}
		// 校验外廓尺寸
		isOk = /^[1-9][0-9]{3,4}(([×*x][1-9][0-9]{3}){2})[m]{2}$/.test(back.size);
		if (!isOk) {
			util.showToastNoIcon('外廓尺寸单位必须为毫米 如：4500*1780*1560mm，请修改！');
			return;
		}
		// 提价数据
		this.setData({
			isRequest: true,
			available: false
		});
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			vehicleInfo: {
				carType: 1,
				haveChange: haveChange, // 行驶证信息OCR结果有无修改过，默认false，修改过传true 【dataType包含6】
				vehPlates: face.numberPlates,
				platesColor: this.data.orderInfo['base'].vehColor,
				owner: face.owner, // 车辆所有者 【dataType包含6】
				ownerAddress: face.address, // 所有人地址 【dataType包含6】
				engineNo: face.engineNo, // 发动机编号 【dataType包含6】
				vehicleType: face.vehicleType, // 车辆类型 【dataType包含6】
				useCharacter: face.useCharacter, // 使用性质 【dataType包含6】
				model: face.model, // 品牌型号 【dataType包含6】
				vin: face.vin, // 车辆识别代号 【dataType包含6】
				registerDate: face.resgisterDate, // 车辆识别代号 【dataType包含6】
				issueDate: face.issueDate, // 发证日期 【dataType包含6】
				issuingUnit: face.issuingUnit, // 发证单位 【dataType包含6】
				licenseMainPage: this.data.drivingLicenseFace.fileUrl, // 主页地址 【dataType包含6】
				licenseVicePage: this.data.drivingLicenseBack.fileUrl, // 副页地址 【dataType包含6】
				fileNumber: back.fileNumber, // 档案编号 【dataType包含6】
				personsCapacity: this.data.personsArr[this.data.personIndex], // 核定载人数 【dataType包含6】
				totalMass: back.totalMass, // 总质量 【dataType包含6】
				loadQuality: back.loadQuality, // 核定载质量 【dataType包含6】
				curbWeight: back.curbWeight, // 整备质量 【dataType包含6】
				size: back.size, // 外廓尺寸 【dataType包含6】
				tractionMass: back.tractionMass, // 准牵引总质量 【dataType包含6】
				recode: back.recode // 检验记录 【dataType包含6】
			}
		};
		// 判断套餐是否需要上传车主身份证 && 行驶证姓名同车主身份证是否一致
		if (parseInt(this.data.productInfo.isOwner) === 1 && this.data.orderInfo.idCard.idCardTrueName !== face.owner) {
			params['dataComplete'] = 0;// 订单资料是否已完善 1-是，0-否
		} else {
			params['dataComplete'] = 1;
		}
		if (app.globalData.firstVersionData && !app.globalData.isModifiedData) {
			// 1.0数据且不是修改资料
			params['upgradeToTwo'] = true; // 1.0数据转2.0
		}
		// 是否需要上传车头照
		if (this.data.productInfo.isHeadImg === 1) {
			params['headstockInfo'] = {
				vehPlate: face.numberPlates,// 车牌号 【dataType包含7】
				fileName: carHead45.fileName, // 文件名称 【dataType包含7】
				fileGroup: carHead45.fileGroup, // 所在组 【dataType包含7】
				fileUrl: carHead45.fileUrl // 访问地址 【dataType包含7】
			};
			params['dataType'] = '67';// 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）,4:获取实名信息，5:获取银行卡信息
		} else {
			params['dataType'] = '6';
		}
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				wx.removeStorageSync('information_validation');
				if (app.globalData.isModifiedData) {
					// 修改资料
					util.go(`/pages/default/update_id_card/update_id_card?type=normal_process`);
				} else {
					if (this.data.productInfo.isOwner === 1 && this.data.orderInfo.idCard.idCardTrueName !== face.owner) {
						util.go(`/pages/default/update_id_card/update_id_card?type=normal_process`);
					} else {
						util.go(`/pages/default/processing_progress/processing_progress?type=main_process&orderId=${app.globalData.orderInfo.orderId}`);
					}
				}
			} else {
				this.setData({
					available: true,
					isRequest: false
				});
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				available: true,
				isRequest: false
			});
		});
	},
	// 选择人数
	onPersonsCapacityPickerChange (e) {
		this.setData({
			personIndex: parseInt(e.detail.value)
		});
		let drivingLicenseBack = this.data.drivingLicenseBack;
		drivingLicenseBack.ocrObject.personsCapacity = this.data.personsArr[this.data.personIndex];
		this.setData({
			drivingLicenseBack
		});
	},
	// 输入项值变化
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.key;
		let type = e.currentTarget.dataset.type;
		let value = e.detail.value.trim();
		let drivingLicenseFace = this.data.drivingLicenseFace;
		let drivingLicenseBack = this.data.drivingLicenseBack;
		// 行驶证正面
		if (parseInt(type) === 3) {
			drivingLicenseFace.ocrObject[key] = value;
		} else { // 行驶证反面
			drivingLicenseBack.ocrObject[key] = value;
		}
		// 如果修改项为车牌 则对行驶证反面和正面车牌数据同时修改
		if (key === 'numberPlates') {
			drivingLicenseFace.ocrObject[key] = value;
			drivingLicenseBack.ocrObject[key] = value;
		}
		this.setData({
			drivingLicenseFace,
			drivingLicenseBack
		});
	},
	// 选择注册日期
	resgisterDatePickerChange (e) {
		let value = e.detail.value;
		let drivingLicenseFace = this.data.drivingLicenseFace;
		drivingLicenseFace.ocrObject.resgisterDate = value;
		this.setData({
			drivingLicenseFace
		});
	},
	// 选择发证日期
	issueDatePickerChange (e) {
		let value = e.detail.value;
		let drivingLicenseFace = this.data.drivingLicenseFace;
		drivingLicenseFace.ocrObject.issueDate = value;
		this.setData({
			drivingLicenseFace
		});
	},
	// 重新拍照识别
	onClickPhotoHandle (e) {
		let type = e.currentTarget.dataset.type;
		type = parseInt(type);
		wx.setStorageSync('photo_recognition_of_driving_license_type', type);
		// 使用返回上一页,审核失败重新进入后返回问题
		// wx.navigateBack({
		// 	delta: 1
		// });
		util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license');
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
	// 隐藏弹窗
	onHandle () {
		this.setData({
			isShowTextarea: true
		});
		wx.removeStorageSync('information_validation');
	},
	// 关闭弹窗  取消办理
	cancelHandle () {
		this.setData({
			isShowTextarea: true
		});
		wx.removeStorageSync('information_validation');
		this.cancelOrder();
	},
	// 1.0行驶证OCR识别
	getOCRVehicleLicense (path,type) {
		// 上传并识别图片
		util.uploadOcrFile(path, type, () => {
		}, (res) => {
			if (res) {
				res = JSON.parse(res);
				if (res.code === 0) { // 识别成功
					if (type === 3) {
						this.setData({
							drivingLicenseFace: res.data[0]
						});
					} else {
						this.setData({
							drivingLicenseBack: res.data[0]
						});
						// 回显人数
						let personCount = this.data.drivingLicenseBack.ocrObject.personsCapacity;
						if (personCount) {
							try {
								personCount = parseInt(personCount);
								let index = this.data.personsArr.indexOf(personCount);
								this.setData({
									personIndex: index !== -1 ? index : 3
								});
							} catch (e) {
							}
						}
					}
				} else { // 识别失败
					util.showToastNoIcon(res.message);
				}
			} else { // 识别失败
				let obj = {};
				this.setData(obj);
				util.showToastNoIcon('行驶证识别失败！');
			}
		}, () => {
			let that = this;
			if (this.data.firstVersionPic4 && this.data.isFirstVersionPic4) {
				this.setData({
					isFirstVersionPic4: false
				});
				that.getNetworkImage(this.data.firstVersionPic4, 4);
			} else {
				util.hideLoading();
				this.setData({
					available: true
				});
			}
		});
	},
	// 1.0车头照识别
	uploadCarHeadPic (path) {
		// 上传文件
		util.uploadFile(path, () => {
			util.showToastNoIcon('车头照识别失败！');
		}, (res) => {
			if (res) {
				res = JSON.parse(res);
				if (res.code === 0) { // 文件上传成功
					this.setData({
						carHead45: res.data[0]
					});
				} else { // 文件上传失败
					util.showToastNoIcon(res.message);
				}
			} else { // 文件上传失败
				util.showToastNoIcon('车头照识别失败!');
			}
		}, () => {
			this.setData({
				available: true
			});
			util.hideLoading();
		});
	},
	onUnload () {
		wx.setStorageSync('return_photo_recognition_of_driving_license', true);
	}
});
