const util = require('../../../utils/util.js');
Page({
	/**
	 * 页面的初始数据
	 */
	data: {
		cameraHeight: '',
		cameraWidth: '',
		image1Src: '',
		videoSrc: '',
		num: 0
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	async onLoad (options) {
		console.log(await wx.getSetting());
		// 调用设置相机大小的方法
		this.setCameraSize();
		this.ctx = wx.createCameraContext();
	},
	// 相机初始化失败
	async onCameraErrorHandle (e) {
		if (!await haveAuth(`scope.camera`)) {
			this.setData({
				showCamera: false
			});
			alert({
				content: '检查您未授权保存图片，请授权',
				showCancel: true,
				confirmText: '授权',
				confirm: async () => {
					await openSetting();
				}
			});
			return;
		}
		await openSetting();
		util.showToastNoIcon('相加初始化失败！');
	},
	/**
	 * 获取系统信息 设置相机的大小适应屏幕
	 */
	setCameraSize () {
		// 获取设备信息
		const res = wx.getSystemInfoSync();
		// 获取屏幕的可使用宽高，设置给相机
		this.setData({
			cameraHeight: res.windowHeight,
			cameraWidth: res.windowWidth
		});
		console.log(res);
	},

	/**
	 *拍照的方法
	 */
	takePhoto () {
		console.log('......');
		this.ctx.takePhoto({
			quality: 'high',
			success: (res) => {
				console.log(res);
				this.setData({
					image1Src: res.tempImagePath
				});
			},
			fail (e) {
				console.log(e);
				// 拍照失败
				console.log('拍照失败');
			}
		});
	},

	/**
	 * 开始录像的方法
	 */
	startShootVideo () {
		console.log('========= 调用开始录像 ===========');
		this.ctx.startRecord({
			success: (res) => {
				wx.showLoading({
					title: '正在录像'
				});
				setTimeout(() => {
					this.stopShootVideo();
				}, 3000);
			},
			fail (e) {
				console.log(e);
				console.log('========= 调用开始录像失败 ===========');
			}
		});
	},

	/**
	 * 结束录像
	 */
	stopShootVideo () {
		console.log('========= 调用结束录像 ===========');
		this.ctx.stopRecord({
			success: (res) => {
				wx.hideLoading();
				this.setData({
					videoSrc: res.tempVideoPath
				});
				this.takePhoto();
			},
			fail (e) {
				console.log(e);
				wx.hideLoading();
				console.log('========= 调用结束录像失败 ===========');
			}
		});
	},

	// touch start 手指触摸开始
	handleTouchStart: function (e) {
		this.startTime = e.timeStamp;
		console.log(' startTime = ' + e.timeStamp);
		console.log(' 手指触摸开始 ' , e);
		console.log(' this ' , this);
	},

	// touch end 手指触摸结束
	handleTouchEnd: function (e) {
		this.endTime = e.timeStamp;
		console.log(' endTime = ' + e.timeStamp);
		console.log(' 手指触摸结束 ', e);
		// 判断是点击还是长按 点击不做任何事件，长按 触发结束录像
		if (this.endTime - this.startTime > 350) {
			// 长按操作 调用结束录像方法
			this.stopShootVideo();
		}
	},

	/**
	 * 点击按钮 - 拍照
	 */
	handleClick: function (e) {
		console.log('endTime - startTime = ' + (this.endTime - this.startTime));
		if (this.endTime - this.startTime < 350) {
			console.log('点击');
			// 调用拍照方法
			this.takePhoto();
		}
	},

	/**
	 * 长按按钮 - 录像
	 */
	handleLongPress: function (e) {
		console.log('endTime - startTime = ' + (this.endTime - this.startTime));
		console.log('长按');
		// 长按方法触发，调用开始录像方法
		this.startShootVideo();
	}
});
