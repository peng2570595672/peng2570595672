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
		title: '车辆行驶证-主页', // 当前拍照提示标题
		picPath: '/pages/default/assets/driving_license_face_border.png', // 拍摄区域边框
		retry: false, // 是否重新拍摄
		pic0: '', // 车头45度
		pic3: '', // 行驶证正面
		pic4: '', // 行驶证反面
		pic0IdentifyResult: -1, // 车头照图片识别结果 -1 未知 0成功 1失败
		pic3IdentifyResult: -1, // 行驶证正面图片识别结果 -1 未知 0成功 1失败
		pic4IdentifyResult: -1, // 行驶证反面图片识别结果 -1 未知 0成功 1失败
		pictureWidth: 0, // 压缩图片
		pictureHeight: 0
	},
	onLoad (options) {
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
	// 下一步
	next () {
		util.go('/pages/default/payment_way/payment_way');
	},
	// 相机初始化失败
	cameraErrorHandle (e) {
		// 拒绝定位导致失败
		if (e.detail.errMsg === 'insertCamera:fail authorize no response') {
			util.alert({
				title: '提示',
				content: '由于您拒绝了摄像头拍摄授权，导致无法正常初始化相机，是否重新授权？',
				showCancel: true,
				confirmText: '重新授权',
				confirm: () => {
					wx.openSetting();
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
		const ctx = wx.createCameraContext();
		ctx.takePhoto({
			quality: 'high',
			success: (res) => {
				this.getPic(res.tempImagePath);
			},
			fail: (res) => {
				util.showToastNoIcon('拍照失败！');
			}
		});
	},
	// 获取图片进行处理
	getPic (path) {
		let key = `pic${this.data.type}`;
		let obj = {};
		obj[key] = path;
		// 设置为未知结果
		obj[`pic${this.data.type}IdentifyResult`] = -1;
		this.setData(obj);
		// 判断是否进行识别
		if (this.data.pic0 && this.data.pic3 && this.data.pic4) {
			// 开始识别
			this.identifyResult();
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
			if (this.data.pic0IdentifyResult === -1) {
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
			util.uploadOcrFile(path, type, () => {
				let obj = {};
				obj[`pic${type}IdentifyResult`] = 1;
				this.setData(obj);
				util.showToastNoIcon(type === 3 ? '识别行驶证正面失败！' : '识别行驶证背面失败！');
			}, (res) => {
				if (res) {
					res = JSON.parse(res);
					if (res.code === 0) { // 识别成功
						let obj = {};
						obj[`pic${type}IdentifyResult`] = 0;
						this.setData(obj);
						wx.setStorageSync(type === 3 ? 'driving_license_face' : 'driving_license_back', JSON.stringify(res));
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
			}, () => {
				// 再次调用 上传行驶证反面
				this.uploadDrivingLicenseOrcFile(4);
			});
		});
	},
	// 识别银行卡
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
						wx.setStorageSync('car_head_45', JSON.stringify(res));
						this.isOver();
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
			picPath: index === 3 ? '/pages/default/assets/driving_license_face_border.png' : index === 4 ? '/pages/default/assets/driving_license_back_border.png' : '/pages/default/assets/car_head_45_border.png',
			title: index === 3 ? '车辆行驶证-主页' : index === 4 ? '车辆行驶证-副页' : '车辆45度照片',
			retry: this.data[key] !== ''
		});
	}
});
