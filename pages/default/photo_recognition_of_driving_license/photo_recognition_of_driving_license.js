/**
 * @author 狂奔的蜗牛
 * @desc 行驶证拍照
 */
const util = require('../../../utils/util.js');
const compressPicturesUtils = require('../../../utils/compress_pictures_utils.js');
const app = getApp();
Page({
	data: {
		type: 3,// 3 行驶证正面 4行驶证反面 0 车头45度
		isType: -1,// 3 行驶证正面 4行驶证反面 0 车头45度
		title: '车辆行驶证-主页', // 当前拍照提示标题
		picPath: '/pages/default/assets/driving_license_face_border.png', // 拍摄区域边框
		retry: 0, // 0 正常进入 1 都有照片  2  重新拍摄 是否重新拍摄
		process: 0,
		showInfo: true, // 用于判断拒绝授权后重新授权camera重新加载显示
		pic0: '', // 车头45度
		pic3: '', // 行驶证正面
		pic4: '', // 行驶证反面
		pic0IdentifyResult: -1, // 车头照图片识别结果 -1 未知 0成功 1失败
		pic3IdentifyResult: -1, // 行驶证正面图片识别结果 -1 未知 0成功 1失败
		pic4IdentifyResult: -1, // 行驶证反面图片识别结果 -1 未知 0成功 1失败
		pictureWidth: 0, // 压缩图片
		pictureHeight: 0,
		isCarHead: true, //  是否上传车头照
		isFromRe: false// 是否来自重新拍照行驶证
	},
	onLoad (options) {
		console.log('onLoad');
		// 拍摄识别类型
		let reg = new RegExp(`^(0|1|2)$`);
		if (reg.test(options.type)) {
			this.setData({
				type: parseInt(options.type)
			});
			this.setData({
				picPath: this.data.type === 3 ? '/pages/default/assets/driving_license_face_border.png' : this.data.type === 4 ? '/pages/default/assets/driving_license_back_border.png' : '/pages/default/assets/car_head_45_border.png',
				title: this.data.type === 3 ? '车辆行驶证-主页' : this.data.type === 4 ? '车辆行驶证-副页' : '车辆45度照片'
			});
		}
		// 设置ios上拉下滑漏出部分背景
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColorBottom: '#33333C'
		});
	},
	onShow () {
		console.log('onShow');
		this.getProduct();
		let type = wx.getStorageSync('photo_recognition_of_driving_license_type');
		console.log(type);
		if (type || type === 0) {
			this.setData({
				isFromRe: true,
				type: type,
				isType: parseInt(type)
			});
		}
		// 读取缓存
		let drivingLicenseFace = wx.getStorageSync('driving_license_face');
		let drivingLicenseBack = wx.getStorageSync('driving_license_back');
		if (drivingLicenseFace && drivingLicenseBack) {
			drivingLicenseFace = JSON.parse(drivingLicenseFace);
			drivingLicenseBack = JSON.parse(drivingLicenseBack);
			let carHeadCard = {};
			if (wx.getStorageSync('car_head_45')) {
				carHeadCard = JSON.parse(wx.getStorageSync('car_head_45'));
				this.setData({
					pic0: carHeadCard.fileUrl
				});
			}
			this.setData({
				pic3: drivingLicenseFace.fileUrl,
				pic4: drivingLicenseBack.fileUrl,
				retry: 2,
				pic0IdentifyResult: 0,
				// pic3IdentifyResult: 0,
				// pic4IdentifyResult: 0,
				pic3IdentifyResult: this.data.type === 3 ? -1 : 0,
				pic4IdentifyResult: this.data.type === 4 ? -1 : 0,
				picPath: this.data.type === 3 ? '/pages/default/assets/driving_license_face_border.png' : this.data.type === 4 ? '/pages/default/assets/driving_license_back_border.png' : '/pages/default/assets/car_head_45_border.png',
				title: this.data.type === 3 ? '车辆行驶证-主页' : this.data.type === 4 ? '车辆行驶证-副页' : '车辆45度照片'
			});
			if (wx.getStorageSync('return_photo_recognition_of_driving_license')) {
				this.setData({
					retry: 1,
					type: -1,
					pic0IdentifyResult: 0,
					pic3IdentifyResult: 0,
					pic4IdentifyResult: 0
				});
			}
			if (wx.getStorageSync('taking_pictures')) {
				this.setData({
					retry: 0,
					type: 3,
					pic0IdentifyResult: -1,
					pic3IdentifyResult: -1,
					pic4IdentifyResult: -1
				});
			}
			wx.removeStorageSync('photo_recognition_of_driving_license_type');
			wx.removeStorageSync('taking_pictures');
		}
	},
	// 根据套餐id获取套餐信息
	getProduct () {
		util.showLoading();
		util.getDataFromServer('consumer/system/get-product-by-id', {
			shopProductId: app.globalData.orderInfo.shopProductId
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				app.globalData.isHeadImg = res.data.isHeadImg === 1 ? true : false;
				this.setData({
					isCarHead: res.data.isHeadImg === 1 ? true : false
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 下一步
	next () {
		util.go('/pages/default/payment_way/payment_way');
	},
	// 相机初始化失败
	cameraErrorHandle (e) {
		console.log(e);
		// 拒绝定位导致失败
		let that = this;
		let _options = {type: this.data.type};
		if (e.detail.errMsg === 'insertCamera:fail authorize no response' || e.detail.errMsg === 'insertCamera:fail auth deny' || e.detail.errMsg === 'insertCamera:fail:auth denied') {
			that.setData({
				showInfo: false
			});
			util.alert({
				title: '提示',
				content: '由于您拒绝了摄像头拍摄授权，导致无法正常初始化相机，是否重新授权？',
				confirmText: '重新授权',
				confirm: () => {
					wx.openSetting({
						success (res) {
							that.onLoad(_options);
							that.setData({
								showInfo: true
							});
						}
					});
				}
			});
		} else {
			util.showToastNoIcon('相加初始化失败！');
		}
	},
	// 从相册选择图片
	choiceFromAbumHandle () {
		wx.chooseImage({
			count: 1,
			sizeType: ['original', 'compressed'],
			sourceType: ['album'],
			success: (res) => {
				this.getPic(res.tempFilePaths[0]);
			},
			fail: (res) => {
				if (res.errMsg !== 'chooseImage:fail cancel') {
					util.showToastNoIcon('选择图片失败！');
				}
			}
		});
	},
	// 拍照
	takePhotoHandle () {
		if (this.data.retry === 2) {
			this.setData({
				retry: 0,
				isType: this.data.type,
				picPath: this.data.type === 3 ? '/pages/default/assets/driving_license_back_border.png' : '/pages/default/assets/car_head_45_border.png'
			});
			return;
		}
		const ctx = wx.createCameraContext();
		ctx.takePhoto({
			quality: 'high',
			success: (res) => {
				// ios手机拍照问题 ios手机拍照需要处理自己会旋转
				if (app.globalData.mobilePhoneSystem) {
					wx.getImageInfo({
						src: res.tempImagePath,
						success: (res) => {
							util.showLoading({
								title: '处理中'
							});
							console.log(res);
							let canvasContext = wx.createCanvasContext('rotatingCanvas');
							let width = res.width;
							let height = res.height;
							this.setData({
								imageWidth: width,
								imageHeight: height
							});
							canvasContext.translate(width / 2, height / 2);
							canvasContext.rotate(0 * Math.PI / 180);
							canvasContext.drawImage(res.path, -width / 2, -height / 2, width, height);
							canvasContext.draw();
							this.drawImage();
						}
					});
				} else {
					this.getPic(res.tempImagePath);
				}
			},
			fail: (res) => {
				util.showToastNoIcon('拍照失败！');
			}
		});
	},
	drawImage (path) {
		let that = this;
		setTimeout(() => {
			// 将生成的canvas图片，转为真实图片
			wx.canvasToTempFilePath({
				x: 0,
				y: 0,
				canvasId: 'rotatingCanvas',
				success (res) {
					console.log(res);
					util.hideLoading();
					let shareImg = res.tempFilePath;
					that.getPic(shareImg);
				},
				fail: function (res) {
				}
			});
		}, 400);
	},
	// 获取图片进行处理
	getPic (path) {
		let key = `pic${this.data.type}`;
		let obj = {};
		obj[key] = path;
		// 设置为未知结果
		obj[`pic${this.data.type}IdentifyResult`] = -1;
		this.setData(obj);
		// 切换到行驶证反面或者车头照
		if (this.data.type === 3 || this.data.type === 4) {
			this.setData({
				type: this.data.type === 3 ? 4 : 0,
				picPath: this.data.type === 3 ? '/pages/default/assets/driving_license_back_border.png' : '/pages/default/assets/car_head_45_border.png',
				title: this.data.type === 3 ? '车辆行驶证-副页' : '车辆45度照片'
			});
		}
		if (!app.globalData.isHeadImg) {
			this.setData({
				title: '车辆行驶证-副页'
			});
		}
		// 判断是否进行识别
		if (this.data.pic4 && this.data.pic3) {
			if (app.globalData.isHeadImg) {
				if (this.data.pic0) {
					// 开始识别
					this.identifyResult();
				}
			} else {
				// 开始识别
				this.identifyResult();
			}
		}
	},
	// 开始识别结果
	identifyResult () {
		util.showLoading({
			title: '正在识别'
		});
		// 上传银行卡
		if (this.data.pic3IdentifyResult === -1) {
			this.uploadDrivingLicenseOrcFile(3);
		} else {
			this.uploadDrivingLicenseOrcFile(4);
		}
	},
	// 上传行驶证
	uploadDrivingLicenseOrcFile (type) {
		// ！== -1表示已识别
		if (this.data.pic3IdentifyResult !== -1 && this.data.pic4IdentifyResult !== -1) {
			// 车头照没有上传
			if (this.data.pic0IdentifyResult === -1 && app.globalData.isHeadImg) {
				this.uploadCarHeadPic();
			} else {
				util.hideLoading();
				// 行驶证正反两面识别成功
				if (this.data.pic3IdentifyResult === 0 && this.data.pic4IdentifyResult === 0) {
					this.isOver();
				}
			}
			return;
		}
		// 裁剪压缩图片
		compressPicturesUtils.processingPictures(this, this.data[`pic${type}`], 'pressCanvas', 640, (res) => {
			let path = res ? res : this.data[`pic${type}`];
			// 上传并识别图片
			util.showLoading({
				title: '正在识别'
			});
			util.uploadOcrFile(path, type, () => {
				let obj = {};
				obj[`pic${type}IdentifyResult`] = 1;
				this.setData(obj);
				util.showToastNoIcon(type === 3 ? '识别行驶证正面失败！' : '识别行驶证背面失败！');
			}, (res) => {
				try {
					if (res) {
						res = JSON.parse(res);
						if (res.code === 0) { // 识别成功
							// 因OCR行驶证正面识别有问题,因此加判断
							if (type === 3 && !res.data[0].ocrObject.owner) {
								util.hideLoading();
								util.showToastNoIcon('照片不能正常识别!请重新拍照上传');
								let obj = {};
								obj[`pic${type}IdentifyResult`] = 1;
								this.setData(obj);
							} else {
								let obj = {};
								obj[`pic${type}IdentifyResult`] = 0;
								this.setData(obj);
								wx.setStorageSync(type === 3 ? 'driving_license_face' : 'driving_license_back', JSON.stringify(res.data[0]));
							}
						} else { // 识别失败
							util.hideLoading();
							util.showToastNoIcon(res.message);
							let obj = {};
							obj[`pic${type}IdentifyResult`] = 1;
							this.setData(obj);
						}
					} else { // 识别失败
						let obj = {};
						obj[`pic${type}IdentifyResult`] = 1;
						this.setData(obj);
						util.showToastNoIcon('识别失败！');
					}
				} catch (e) {
					let obj = {};
					obj[`pic${type}IdentifyResult`] = 1;
					this.setData(obj);
					util.showToastNoIcon('文件服务器异常！');
				}
			}, () => {
				// 再次调用 上传行驶证反面
				this.uploadDrivingLicenseOrcFile(4);
			});
		});
	},
	// 识别车头照
	uploadCarHeadPic () {
		// 裁剪压缩图片
		compressPicturesUtils.processingPictures(this, this.data.pic0, 'pressCanvas', 640, (res) => {
			let path = res ? res : this.data.pic0;
			// 上传文件
			util.uploadFile(path, () => {
				this.setData({
					pic0IdentifyResult: 1
				});
				util.showToastNoIcon('上传车头照失败！');
			}, (res) => {
				if (res) {
					res = JSON.parse(res);
					if (res.code === 0) { // 文件上传成功
						this.setData({
							pic0IdentifyResult: 0
						});
						wx.setStorageSync('car_head_45', JSON.stringify(res.data[0]));
						if (this.data.pic3IdentifyResult === 0 && this.data.pic4IdentifyResult === 0) {
							this.isOver();
						}
					} else { // 文件上传失败
						this.setData({
							pic0IdentifyResult: 1
						});
						util.showToastNoIcon(res.message);
					}
				} else { // 文件上传失败
					this.setData({
						pic0IdentifyResult: 1
					});
					util.showToastNoIcon('上传车头照失败');
				}
			}, () => {
				util.hideLoading();
			});
		});
	},
	// 所有图片正常完成
	isOver () {
		util.go('/pages/default/information_validation/information_validation');
	},
	// 返回
	onClickBackHandle () {
		// 重新拍照行驶证点击左上角返回
		if (wx.getStorageSync('return_photo_recognition_of_driving_license')) {
			wx.setStorageSync('information_validation', true);
		}
		if (this.data.isFromRe) {
			this.isOver();
			return;
		}
		wx.navigateBack({
			delta: 1
		});
	},
	// 点切换当前选中预览图
	onClickRetryHandle (e) {
		let index = e.currentTarget.dataset.index;
		index = parseInt(index);
		let key = `pic${index}`;
		this.setData({
			type: index,
			isType: index,
			picPath: index === 3 ? '/pages/default/assets/driving_license_face_border.png' : index === 4 ? '/pages/default/assets/driving_license_back_border.png' : '/pages/default/assets/car_head_45_border.png',
			title: index === 3 ? '车辆行驶证-主页' : index === 4 ? '车辆行驶证-副页' : '车辆45度照片',
			retry: this.data[key] === '' ? 0 : 2
		});
	},
	onUnload () {
		if (wx.getStorageSync('return_photo_recognition_of_driving_license')) {
			wx.setStorageSync('information_validation', true);
		}
	}
});
