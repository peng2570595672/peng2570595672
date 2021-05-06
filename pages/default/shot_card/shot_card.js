/**
 * @author 老刘
 * @desc 选择OCR识别类型
 */
const util = require('../../../utils/util.js');
const compressPicturesUtils = require('../../../utils/compress_pictures_utils.js');
const app = getApp();
Page({
	data: {
		type: 0,// 1身份证正面  2身份证反面  3行驶证正面  4行驶证反面  5驾驶证正面  6驾驶证反面  7营业执照  8车牌号  9银行卡  10统一社会信用代码证书  11 道路运输证(阿里- 道路运输经营许可证) 12 道路运输证(华为- 道路运输证)
		picPath: 'id_card_face', // 拍摄区域边框
		title: '身份证原件照片(人像面) ', // 当前拍摄标题
		titleList: ['身份证原件照片(人像面)', '身份证原件照片(国徽面)', '行驶证原件正页(含车辆类型) ', '行驶证原件副页(含车辆类型) ', '', '', '', '', '', '', '', '道路运输证'],
		sampleImgList: ['id_card_face', 'id_card_back', 'driving_license_face', 'driving_license_back', '', '', '', '', '' , '', '', 'road_transport_certificate'], // 示例图片
		picUrl: '', // 拍摄图片url
		pictureWidth: 0, // 压缩图片
		pictureHeight: 0,
		showInfo: true, // 用于判断拒绝授权后重新授权camera重新加载显示
		compressionUrl: ''
	},
	onLoad (options) {
		app.globalData.handlingOCRType = 0;
		// 当前拍照类型
		this.setData({
			type: parseInt(options.type)
		});
		if (options.pathUrl && options.pathUrl !== 'undefined') {
			this.setData({
				picUrl: options.pathUrl
			});
		}
		this.setData({
			picPath: this.data.sampleImgList[this.data.type - 1],
			title: this.data.titleList[this.data.type - 1]
		});
		// 设置ios滑动上下部分背景
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColorBottom: '#33333C'
		});
	},
	onClickShoot () {
		this.setData({
			picUrl: ''
		});
	},
	onClickComplete () {
		app.globalData.handlingOCRType = this.data.type;
		wx.setStorageSync(`passenger-car-${this.data.type}`, this.data.compressionUrl);
		wx.navigateBack({
			delta: 1
		});
	},
	// 相机初始化失败
	cameraErrorHandle (e) {
		console.log(e);
		// 拒绝定位导致失败
		let that = this;
		let _options = {type: this.data.type};
		if (e.detail.errMsg.includes('fail authorize no response') || e.detail.errMsg.includes('fail auth deny') || e.detail.errMsg.includes('fail:auth denied')) {
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
		this.setData({
			picUrl: path
		});
		// 开始处理照片
		this.uploadCardOrcFile();
	},
	// 裁剪压缩图片 并缓存
	uploadCardOrcFile () {
		// 裁剪压缩图片
		compressPicturesUtils.processingPictures(this, this.data.picUrl, 'pressCanvas', 640, (res) => {
			this.setData({
				compressionUrl: res ? res : this.data.picUrl
			});
		});
	}
});
