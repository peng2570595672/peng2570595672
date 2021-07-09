const util = require('../../utils/util.js');
const app = getApp();
let savePath;
let context;
Component({
	properties: {
		originUserPage: {
			type: Boolean,
			value: false
		}
	},
	data: {
		screenRatio: 750 / app.globalData.screenWindowAttribute.windowWidth, // 系统屏幕参数
		canvasDraw: false, // canvas图片是否绘制 (默认值必须是false)
		qrImgLoadSuccess: false, // 二维码图片是否加载完毕
		qrCodeUrl: '', // 二维码路径
		nickName: '', // 原点用户昵称
		avatarUrl: '', // 原点用户头像
		sharePageUrl: 'pages/crowdsourcing/new_user/new_user',
		mask: false,
		wrapper: false
	},
	methods: {
		ok (e) {
			this.hide(e,true);
		},
		show () {
			this.setData({
				mask: true,
				wrapper: true
			});
			this.setNAData();
		},
		noHide () {},
		hide (e,flag) {
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				if (flag) {
					this.triggerEvent('onHandle');
				} else {
					this.triggerEvent('cancelHandle');
				}
			}, 400);
		},
		// 设置昵称头像
		setNAData () {
			this.setData({
				nickName: app.globalData.crowdsourcingUserInfo ? app.globalData.crowdsourcingUserInfo.nickName : '',
				avatarUrl: app.globalData.crowdsourcingUserInfo ? app.globalData.crowdsourcingUserInfo.avatarUrl : 'https://file.cyzl.com/g001/M00/00/68/CgAAD1zt9pyALrxkAAAPcVFYqis569.png'
			});
			// if (!this.data.canvasDraw) {
			// 	this.loadMyORCodeImage();
			// }
			this.loadMyORCodeImage();
			this.getQrCodeUrl();
		},
		imageLoad () {
			this.setData({qrImgLoadSuccess: true});
		},
		getQrCodeUrl () {
			util.showLoading();
			let params = {
				shopId: app.globalData.crowdsourcingServiceProvidersId,
				pageUrl: this.data.sharePageUrl
			};
			util.getDataFromServer('consumer/member/handleMemberCrowdSourcing', params, () => {
				util.showToastNoIcon('调用成为推广者接口失败！');
			}, (res) => {
				if (res.code === 0) {
					this.setData({
						qrCodeUrl: res.data.qrCodeUrl
					});
					this.uploadInfo();
				} else {
					util.showToastNoIcon(res.message);
				}
			}, app.globalData.userInfo.accessToken, () => {
				util.hideLoading();
			});
		},
		// 更新头像用户昵称
		uploadInfo () {
			// 同步微信头像昵称到服务器
			if (this.data.nickName && this.data.nickName.length > 0 && app.globalData.memberId && app.globalData.memberId.length > 0) {
				util.showLoading();
				let params = {
					nickName: this.data.nickName,
					sex: app.globalData.crowdsourcingUserInfo.gender,
					province: app.globalData.crowdsourcingUserInfo.province,
					city: app.globalData.crowdsourcingUserInfo.city
				};
				util.getDataFromServer('consumer/member/updateInfo', params, () => {
					util.showToastNoIcon('提交用户信息失败！');
				}, (res) => {
					if (res.code === 0) {
					} else {
						util.showToastNoIcon(res.message);
					}
				}, app.globalData.userInfo.accessToken, () => {
					util.hideLoading();
				});
			}
		},
		loadMyORCodeImage () {
			let myQRCodeLoc = wx.getStorageSync('my-qr-code-location');
			if (!wx.canIUse('downloadFile')) {
				util.showToastNoIcon('当前微信版本不支持图片文件下载');
				return;
			}
			if (this.data.qrImgLoadSuccess) { // 如果二维码图片加载完毕
				wx.downloadFile({
					url: this.data.qrCodeUrl,
					success: (res) => {
						// 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
						if (res.statusCode === 200) {
							if (res && res.tempFilePath) {
								wx.setStorageSync('my-qr-code-location', res.tempFilePath);
								this.loadHeadPhotoImage();
							}
						}
					},
					fail: () => {
						util.showToastNoIcon('图片下载失败，请刷新重试');
						wx.hideLoading();
					}
				});
			} else {
				setTimeout(() => {
					this.loadMyORCodeImage();
				}, 400);
			}
		},
		weixinShare () {
		},
		loadHeadPhotoImage () {
			let headPhoto = wx.getStorageSync('head-photo');
			if (!wx.canIUse('downloadFile')) {
				wx.hideLoading();
				util.showToastNoIcon('当前微信版本不支持图片文件下载');
				return;
			}
			wx.downloadFile({
				url: this.data.avatarUrl,
				success: (res) => {
					// 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
					if (res.statusCode === 200) {
						wx.setStorageSync('head-photo', res.tempFilePath);
						this.draw();
					}
				},
				fail: () => {
					util.showToastNoIcon('图片下载失败，请刷新重试');
					wx.hideLoading();
				}
			});
		},
		draw () {
			let that2 = this;
			let myQRCode = wx.getStorageSync('my-qr-code-location');
			let headPhoto = wx.getStorageSync('head-photo');
			context = wx.createCanvasContext('pictorial');
			// 对应的 id为pictorial 的canvas组件必须在父组件中
			// 对应的 drawImage对应的是父组件的图片层级
			context.drawImage('../assets/share-bg.png', 0, 0, 593 / this.data.screenRatio, 790 / this.data.screenRatio);

			// 绘制圆形头像开始
			context.save();
			context.beginPath();
			context.arc(61 / this.data.screenRatio, 61 / this.data.screenRatio, 31 / this.data.screenRatio, 0, 2 * Math.PI, false); // 画一个圆形裁剪区域
			context.clip(); // 裁剪
			context.drawImage(headPhoto, 30 / this.data.screenRatio, 29 / this.data.screenRatio, 62 / this.data.screenRatio, 62 / this.data.screenRatio);
			context.restore();
			// 绘制圆形头像结束

			context.drawImage(myQRCode, 185 / this.data.screenRatio, 485 / this.data.screenRatio, 220 / this.data.screenRatio, 220 / this.data.screenRatio);
			context.setFillStyle('#fff');
			context.setFontSize(24 / this.data.screenRatio);
			context.fillText('专属邀请卡', 115 / this.data.screenRatio, 66 / this.data.screenRatio);
			// context.fillText('专属邀请卡', 115 / this.data.screenRatio, 66 / this.data.screenRatio);
			context.save();
			context.restore();
			wx.hideLoading();
			context.draw(false, () => {
				setTimeout(() => {
					wx.canvasToTempFilePath({
						x: 0,
						y: 0,
						width: 593 / this.data.screenRatio,
						height: 790 / this.data.screenRatio,
						destWidth: 593 / this.data.screenRatio * app.globalData.screenWindowAttribute.pixelRatio,
						destHeight: 790 / this.data.screenRatio * app.globalData.screenWindowAttribute.pixelRatio,
						canvasId: 'pictorial',
						success (res) {
							savePath = res.tempFilePath;
							that2.setCanvasDraw();
						}
					});
				}, 1000);
			});
		},
		setCanvasDraw () {
			this.setData({
				canvasDraw: true
			});
		},
		saveImage () {
			if (!this.data.canvasDraw) { // 防止动画还未保存到本地
				util.showLoading({title: '处理中..'});
				setTimeout(() => {
					this.saveImage();
				}, 800);
				return;
			}
			wx.hideLoading();
			wx.saveImageToPhotosAlbum({
				filePath: savePath,
				success: () => {
					util.alert({
						content: '已经将海报成功保存到您相册，快去分享海报到朋友圈吧~',
						confirm: () => {
						}
					});
				},
				fail: (res) => {
					if (res.errMsg === 'saveImageToPhotosAlbum:fail auth deny') {
						util.alert({
							content: '请授权允许保存图片到相册',
							confirmText: '去授权',
							confirm: () => {
								wx.openSetting();
							}
						});
					} else {
						util.showToastNoIcon('保存失败');
					}
				}
			});
		}
	}
});
