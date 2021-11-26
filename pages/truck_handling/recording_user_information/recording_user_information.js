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
		navbarHeight: app.globalData.navbarHeight,
		picPath: '',
		videoSrc: '',
		certificationStatus: 0// 0 未认证  1 认证中  2 认证成功
	},
	async onLoad () {
		await this.onCameraErrorHandle();
	},
	async onShow () {
		this.setData({
			showCamera: true
		});
	},
	// 相机初始化失败
	async onCameraErrorHandle () {
		if (!await haveAuth(`scope.camera`) || !await haveAuth(`scope.record`)) {
			this.setData({
				showCamera: false
			});
			alert({
				content: '检查您未授权录音或者拍照，请授权',
				showCancel: true,
				confirmText: '授权',
				confirm: async () => {
					await openSetting();
				}
			});
			return;
		}
		await openSetting();
		showToastNoIcon('相加初始化失败！');
	},

	/**
	 *拍照的方法
	 */
	async takePhoto () {
		const takePhoto = await wxApi2Promise(wx.createCameraContext().takePhoto, {
			quality: 'high'
		}, this);
		// ios手机拍照问题 ios手机拍照需要处理自己会旋转
		if (app.globalData.mobilePhoneSystem) {
			const imageInfo = await wxApi2Promise(wx.getImageInfo, {
				src: takePhoto.tempImagePath
			}, this);
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
				pic: takePhoto.tempImagePath
			});
			this.uploadFile();
		}
	},
	drawImage () {
		let that = this;
		setTimeout(async () => {
			// 将生成的canvas图片，转为真实图片
			const path = await wxApi2Promise(wx.canvasToTempFilePath, {
				x: 0,
				y: 0,
				canvasId: 'rotatingCanvas'
			}, this);
			that.setData({
				pic: path.tempFilePath
			});
			that.uploadFile();
		}, 400);
	},
	// 处理并上传图片
	uploadFile () {
		// 裁剪压缩图片
		this.livenessRecognitionVerify();
		// compressPicturesUtils.processingPictures(this, this.data.pic, 'pressCanvas', 640, (res) => {
		// 	let path = res ? res : this.data.pic;
		// 	// 上传图片
		// 	this.setData({
		// 		picPath: path
		// 	});
		// 	this.livenessRecognitionVerify();
		// });
	},
	// 上送腾讯云活体人脸核身核验
	async livenessRecognitionVerify () {
		this.setData({
			certificationStatus: 1
		});
		const result = await util.getDataFromServersV2('consumer/member/bcm/livenessRecognitionVerify', {
			webSubPhotoUrl: 'https://file.cyzl.com/g001/M07/6A/F8/oYYBAGGdqu-ASOpWAAKISWHlGGc696.png',
			orderId: app.globalData.orderInfo.orderId,// 订单id
			// webSubPhotoUrl: this.data.picPath,
			idCardTest: '522222199905290414',
			nameTest: '章伟',
			videoBase64: this.data.videoSrc
		});
		if (!result) return;
		if (result.code === 0) {
			console.log(result);
			this.setData({
				certificationStatus: 2
			});
			util.go(`/pages/truck_handling/binding_account_bocom/binding_account_bocom`);
		} else {
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
		await wxApi2Promise(wx.createCameraContext().startRecord, {}, this);
		this.setData({
			isStart: true
		});
		setTimeout(() => {
			this.stopShootVideo();
		}, 3000, 2);
	},
	/**
	 * 结束录像
	 */
	async stopShootVideo () {
		const res = await wxApi2Promise(wx.createCameraContext().stopRecord, {}, this);
		const pathInfo = await wxApi2Promise(wx.getFileSystemManager().readFile, {
			filePath: res.tempVideoPath,
			encoding: 'base64'
		}, this);
		console.log(pathInfo);
		this.setData({
			videoSrc: pathInfo.data,
			isStart: false
		});
		await this.takePhoto();
	}
});
