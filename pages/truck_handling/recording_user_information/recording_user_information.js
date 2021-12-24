/**
 * @author 老刘
 * @desc 录制用户视频及截取图片
 */
import { openSetting, showToastNoIcon, haveAuth, alert, wxApi2Promise } from '../../../utils/utils.js';
const util = require('../../../utils/util.js');
const compressPicturesUtils = require('../../../utils/compress_pictures_utils.js');
const app = getApp();
Page({
	data: {
		showCamera: true,
		isStart: false,
		isShooting: false,
		navbarHeight: app.globalData.navbarHeight,
		picPath: '',
		ctx: '',
		videoSrc: '',
		pictureWidth: 0, // 压缩图片
		pictureHeight: 0,
		certificationStatus: 0// 0 未认证  1 认证中  2 认证成功
	},
	async onLoad () {
		await this.onCameraErrorHandle();
		this.setData({
			ctx: wx.createCameraContext()
		});
	},
	async onShow () {
		this.setData({
			showCamera: true
		});
	},
	// 相机初始化失败
	async onCameraErrorHandle (e) {
		if (!await haveAuth(`scope.camera`) || !await haveAuth(`scope.record`)) {
			this.setData({
				showCamera: false
			});
			alert({
				content: '检查您未授权录音或者拍照，请授权',
				showCancel: true,
				confirmText: '授权',
				confirmColor: '#576B95',
				confirm: async () => {
					await openSetting();
				}
			});
		}
		// showToastNoIcon('相加初始化失败！');
	},

	/**
	 *拍照的方法
	 */
	async takePhoto () {
		this.data.ctx.takePhoto({
			quality: 'high',
			success: async (res) => {
				// ios手机拍照问题 ios手机拍照需要处理自己会旋转
				if (app.globalData.mobilePhoneSystem) {
					const imageInfo = await wxApi2Promise(wx.getImageInfo, {
						src: res.tempImagePath
					}, this.data);
					let canvasContext = wx.createCanvasContext('rotatingCanvas');
					let width = imageInfo.width;
					let height = imageInfo.height;
					this.setData({
						imageWidth: width,
						imageHeight: height
					});
					canvasContext.translate(width / 2, height / 2);
					canvasContext.rotate(0 * Math.PI / 180);
					canvasContext.drawImage(imageInfo.path, -width / 2, -height / 2, width, height);
					canvasContext.draw();
					this.drawImage();
				} else {
					this.setData({
						pic: res.tempImagePath
					});
					this.uploadFile();
				}
			},
			fail: (e) => {
				this.setData({
					isShooting: false
				});
				console.log(e);
			}
		});
		// const takePhoto = await wxApi2Promise(this.data.ctx.takePhoto, {
		// 	quality: 'high'
		// }, this.data);
	},
	drawImage () {
		let that = this;
		setTimeout(async () => {
			// 将生成的canvas图片，转为真实图片
			const path = await wxApi2Promise(wx.canvasToTempFilePath, {
				x: 0,
				y: 0,
				canvasId: 'rotatingCanvas'
			}, this.data);
			that.setData({
				pic: path.tempFilePath
			});
			that.uploadFile();
		}, 400);
	},
	// 处理并上传图片
	uploadFile () {
		util.showLoading({
			title: '资料上传中...'
		});
		// 裁剪压缩图片
		compressPicturesUtils.processingPictures(this, this.data.pic, 'pressCanvas', 640, (res) => {
			let path = res ? res : this.data.pic;
			// 上传文件
			util.uploadFile(path, () => {
				util.showToastNoIcon('上传补充角度照失败！');
			}, (res) => {
				if (res) {
					res = JSON.parse(res);
					if (res.code === 0) { // 文件上传成功
						this.livenessRecognitionVerify(res.data[0].fileUrl);
					} else { // 文件上传失败
						this.setData({
							isShooting: false
						});
						util.hideLoading();
						util.showToastNoIcon(res.message);
					}
				} else { // 文件上传失败
					this.setData({
						isShooting: false
					});
					util.hideLoading();
					util.showToastNoIcon('上传补充角度照失败');
				}
			}, () => {
			});
		});
	},
	// 上送腾讯云活体人脸核身核验
	async livenessRecognitionVerify (webSubPhotoUrl) {
		this.setData({
			certificationStatus: 1
		});
		const result = await util.getDataFromServersV2('consumer/member/bcm/livenessRecognitionVerify', {
			orderId: app.globalData.orderInfo.orderId,// 订单id
			webSubPhotoUrl: webSubPhotoUrl,
			videoBase64: this.data.videoSrc
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				certificationStatus: 2
			});
			util.go(`/pages/truck_handling/binding_account_bocom/binding_account_bocom`);
		} else {
			util.hideLoading();
			util.showToastNoIcon(result.message);
			setTimeout(() => {
				wx.navigateBack({
					delta: 1
				});
			}, 3000);
		}
	},
	/**
	 * 开始录像的方法
	 */
	async onShotVideo () {
		if (this.data.isShooting) return;
		this.setData({
			isShooting: true
		});
		// await wxApi2Promise(wx.createCameraContext().startRecord, {}, this.data);
		// this.setData({
		// 	isStart: true
		// });
		// setTimeout(() => {
		// 	this.stopShootVideo();
		// }, 3000, 2);
		this.data.ctx.startRecord({
			success: () => {
				this.setData({
					isStart: true
				});
				setTimeout(() => {
					this.stopShootVideo();
				}, 3000, 2);
			},
			fail: (e) => {
				console.log(e);
			}
		});
	},
	/**
	 * 结束录像
	 */
	async stopShootVideo () {
		const res = await wxApi2Promise(this.data.ctx.stopRecord, {}, this.data);
		const pathInfo = await wxApi2Promise(wx.getFileSystemManager().readFile, {
			filePath: res.tempVideoPath,
			encoding: 'base64'
		}, this.data);
		this.setData({
			videoSrc: pathInfo.data,
			isStart: false
		});
		await this.takePhoto();
	}
});
