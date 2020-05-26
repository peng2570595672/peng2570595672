/**
 * @author 狂奔的蜗牛
 * @desc 选择支付方式
 */
const util = require('../../../utils/util.js');
const compressPicturesUtils = require('../../../utils/compress_pictures_utils.js');
const app = getApp();
Page({
	data: {
		type: 0,// 0 银行卡 1身份证正面 2 身份证反面
		picPath: '/pages/default/assets/bank_border.png', // 拍摄区域边框
		title: '请拍摄银行卡数字面', // 当前拍摄标题
		pic0: '', // 银行卡图片url
		pic1: '', // 身份证图片正面url
		pic2: '', // 身份证图片反面url
		pic1IdentifyResult: -1, // 身份证正面图片识别结果 -1 未知 0成功 1失败
		pic2IdentifyResult: -1,// 身份证反面图片识别结果 -1 未知 0成功 1失败
		pictureWidth: 0, // 压缩图片
		pictureHeight: 0
	},
	onLoad (options) {
		// 当前拍照类型
		let reg = new RegExp(`^(0|1|2)$`);
		if (reg.test(options.type)) {
			this.setData({
				type: parseInt(options.type)
			});
			this.setData({
				picPath: this.data.type === 1 ? '/pages/default/assets/id_card_face_border.png' : this.data.type === 2 ? '/pages/default/assets/id_card_back_border.png' : '/pages/default/assets/bank_border.png',
				title: this.data.type === 1 ? '请拍摄身份证正面' : this.data.type === 2 ? '请拍摄身份证反面' : '请拍摄银行卡数字面'
			});
		}
		// 设置ios滑动上下部分背景
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColorBottom: '#33333C'
		});
	},
	// 相机初始化失败
	onCameraErrorHandle (e) {
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
			wx.openSetting();
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
		let key = `pic${this.data.type}`;
		let obj = {};
		obj[key] = path;
		// 设置为未知结果
		if (this.data.type === 1 || this.data.type === 2) {
			obj[`pic${this.data.type}IdentifyResult`] = -1;
		}
		this.setData(obj);
		// 切换到身份证反面
		if (this.data.type === 1) {
			this.setData({
				type: 2,
				title: '请拍摄身份证反面',
				picPath: '/pages/default/assets/id_card_back_border.png'
			});
		}
		// 判断是否进行识别
		if (this.data.pic0 || (this.data.pic1 && this.data.pic2)) {
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
		if (this.data.type === 0) {
			this.uploadBankCardOcrFile();
		} else {
			if (this.data.pic1IdentifyResult === -1) {
				// 行驶证正面
				this.uploadIdCardOrcFile(1);
			} else {
				// 行驶证反面
				this.uploadIdCardOrcFile(2);
			}
		}
	},
	// 上传身份证
	uploadIdCardOrcFile (type) {
		if (this.data.pic1IdentifyResult !== -1 && this.data.pic2IdentifyResult !== -1) {
			util.hideLoading();
			// 行驶证正面反面都识别成功了
			if (this.data.pic1IdentifyResult === 0 && this.data.pic2IdentifyResult === 0) {
				wx.showToast({
					title: '识别成功',
					icon: 'success',
					duration: 2000
				});
				setTimeout(() => {
					wx.navigateBack({
						delta: 1
					});
				}, 2000);
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
				util.showToastNoIcon(type === 1 ? '识别身份证正面失败！' : '识别身份证背面失败！');
			}, (res) => {
				try {
					if (res) {
						res = JSON.parse(res);
						if (res.code === 0) { // 识别成功
							let obj = {};
							obj[`pic${type}IdentifyResult`] = 0;
							this.setData(obj);
							wx.setStorageSync(type === 1 ? 'id_card_face' : 'id_card_back', JSON.stringify(res));
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
				this.uploadIdCardOrcFile(2);
			});
		});
	},
	// 识别银行卡
	uploadBankCardOcrFile () {
		// 裁剪压缩图片
		compressPicturesUtils.processingPictures(this, this.data.pic0, 'pressCanvas', 640, (res) => {
			let path = res ? res : this.data.pic0;
			util.uploadOcrFile(path, 9, () => {
				util.showToastNoIcon('识别卡号失败！');
			}, (res) => {
				if (res) {
					res = JSON.parse(res);
					util.hideLoading();
					if (res.code === 0) { // 识别成功
						wx.showToast({
							title: '识别成功',
							icon: 'success',
							duration: 2000
						});
						setTimeout(() => {
							wx.setStorageSync('bank_card_identify_result', JSON.stringify(res));
							wx.navigateBack({
								delta: 1
							});
						}, 2000);
					} else { // 识别失败
						util.showToastNoIcon(res.message);
					}
				} else { // 识别失败
					util.hideLoading();
					util.showToastNoIcon('识别失败！');
				}
			});
		});
	},
	// 切换身份证正反两面
	onClickSwitchHandle (e) {
		let type = e.currentTarget.dataset.type;
		type = parseInt(type);
		this.setData({
			type,
			title: type === 1 ? '请拍摄身份证正面' : type === 2 ? '请拍摄身份证反面' : '请拍摄银行卡数字面',
			picPath: type === 1 ? '/pages/default/assets/id_card_face_border.png' : type === 2 ? '/pages/default/assets/id_card_back_border.png' : '/pages/default/assets/bank_border.png'
		});
	}
});
