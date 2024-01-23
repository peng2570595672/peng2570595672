import {
	wxApi2Promise
} from '../../../utils/utils';

/**
 * @author 老刘
 * @desc 签字确认-真机调试不能绘制
 */
const util = require('../../../utils/util.js');
const app = getApp();
// 倒计时计时器
let timer;
let context; //
Page({
	data: {
		identifyingCode: '获取验证码',
		time: 59, // 倒计时
		isGetIdentifyingCoding: false, // 获取验证码中
		signType: 1, // 1-签字  2-验证码
		mobilePhone: '',
		winInfo: {},
		windowHeight: '',
		beginDraw: false, // 开始绘画
		startX: 0, // 屏幕点x坐标
		startY: 0, // 屏幕点y坐标
		isNeedJump: true,
		strokeNum: 0 ,// 笔画
		isAgreement: false,
		choiceIndex: -1

	},
	async onLoad (options) {
		this.setData({
			winInfo: app.globalData.screenWindowAttribute,
			choiceIndex: options.choiceIndex,
			product_price: options.product_price
		});
		console.log('已经设置index',this.data.choiceIndex);
		console.log('已经设置product_price',this.data.product_price);
		context = wx.createCanvasContext('canvas-id');
		context.setLineWidth(4); // 设置线宽
		context.setLineCap('round'); // 设置线末端样式
		context.setLineJoin('round'); // 设置线条的结束交点样式
		this.getETCDetail();
	},
	async draw (signPath) {
		// 内容位置参照wxss
		// 4 * rpx2px 4倍图,下载更高清;相应的canvas样式放大对应倍数(如果还不清晰,再对应加大倍数即可)
		const bgres = await wxApi2Promise(wx.getImageInfo, {
			src: 'https://file.cyzl.com/g001/M01/CF/AF/oYYBAGQZZFiAdGRiAAC64hEQVpg731.png'
		}, this.data);
		const winInfo = app.globalData.screenWindowAttribute;
		const magnification = 4;
		const ctx = wx.createCanvasContext('pictorial', this);
		ctx.clearRect(0, 0, magnification * util.getPx(winInfo.windowWidth), magnification * util.getPx(winInfo.windowHeight));
		// 绘制背景
		ctx.drawImage(bgres.path, 0, 0, magnification * util.getPx(winInfo.windowWidth), magnification * util.getPx(winInfo.windowHeight));
		// 绘制签字开始
		ctx.save();
		ctx.beginPath();
		ctx.drawImage(signPath, magnification * util.getPx(14), magnification * util.getPx(300 + winInfo.statusBarHeight), magnification * util.getPx(319), magnification * util.getPx(283));
		ctx.restore();
		// 绘制签字结束
		ctx.draw(true);
		this.setData({
			initFinished: true
		});
		const res = await wxApi2Promise(wx.canvasToTempFilePath, {
			x: 0,
			y: 0,
			width: 4 * util.getPx(winInfo.windowWidth) * 4,
			height: 4 * util.getPx(winInfo.windowHeight) * 4,
			destWidth: 4 * util.getPx(winInfo.windowWidth) * 4 * this.pixelRatio,
			destHeight: 4 * util.getPx(winInfo.windowHeight) * 4 * this.pixelRatio,
			canvasId: 'pictorial'
		}, this);
		console.log('绘制结束', res);
		this.uploadFile(res.tempFilePath);
	},
	// 清除签名
	handleClearSign () {
		context.draw(); // true 接着上次的继续画图，false 取消上次的画图 默认值
		context.setLineWidth(4);
		context.setLineCap('round');
		context.setLineJoin('round');
		this.setData({
			strokeNum: 0,
			startX: 0,
			startY: 0
		});
	},
	// 设置单选value
  radioChange () {
		console.log('111',this.data.isAgreement);
    this.setData({
      isAgreement: !this.data.isAgreement
    });
 },
	// 提交签名
	handleSubmitSign () {
		if (this.data.strokeNum <= 1) {
			util.showToastNoIcon('请重新签字！');
			return;
		}
		console.log(this.data.isAgreement);
		if (!this.data.isAgreement) {
			util.showToastNoIcon('请勾选知晓套餐权益！');
			return;
		}
		util.showLoading('加载中');
		const that = this;
		wx.canvasToTempFilePath({
			canvasId: 'canvas-id',
			fileType: 'png',
			success: (res) => {
				if (!res.tempFilePath) {
					util.hideLoading();
					util.showToastNoIcon('生成签名图片出错！');
					return;
				}
				this.draw(res.tempFilePath);
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('保存报错，请稍后重试！');
			}
		});
	},
	uploadFile (path) {
		// 上传文件
		util.uploadFile(path, () => {
			util.hideLoading();
			util.showToastNoIcon('上传失败！');
		}, (res) => {
			if (res) {
				res = JSON.parse(res);
				if (res.code === 0) { // 文件上传成功
					this.saveSign(res.data[0].fileUrl);
				} else { // 文件上传失败
					util.hideLoading();
					util.showToastNoIcon(res.message);
				}
			} else { // 文件上传失败
				util.hideLoading();
				util.showToastNoIcon('上传失败');
			}
		}, () => {});
	},
	async saveSign (fileUrl) {
		util.showLoading('加载中');
		let params = {
			signType: this.data.signType,
			userSign: fileUrl,
			orderId: app.globalData.orderInfo.orderId // 订单id
		};
		console.log('保存签名信息');
		console.log(params);
		const result = await util.getDataFromServersV2('consumer/order/user/sign', params);
		if (!result) return;
		if (result.code === 0) {
			const obj = this.data.orderInfo;
			if (obj.orderType === 51) {
				if (obj.contractStatus === 2) {
					app.globalData.orderInfo.orderId = obj.id;
					// 恢复签约
					await this.restoreSign(obj);
				} else {
					app.globalData.signAContract = -1;
					await this.weChatSign(obj);
				}
				return;
			}
			if (!this.data.isNeedJump) return;
			this.setData({
				isNeedJump: false
			});
			if (this.data.choiceIndex !== -1) {
				let page = getCurrentPages(); // 获取当前页面栈
				let prevPage = page[page.length - 2]; // 代表的就是上一页的实例，相当于this
				prevPage.data.listOfPackages[this.data.choiceIndex].okSign = true;
				// prevPage.setData({
				// 	listOfPackages:prevPage.data.listOfPackages
				// });
				wx.navigateBack({
					delta: 1// 23456
				});
				return;
			}
			util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests`);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 加载订单详情
	async getETCDetail () {
		const result = await util.getDataFromServersV2('consumer/order/order-detail', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			let orderInfo = result.data;
			orderInfo['selfStatus'] = util.getStatus(orderInfo);
			this.setData({
				orderInfo
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 微信签约
	async weChatSign (obj) {
		util.showLoading('加载中');
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({
			available: true,
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			util.hideLoading();
			let res = result.data.contract;
			// 签约车主服务 2.0
			app.globalData.isSignUpImmediately = true; // 返回时需要查询主库
			app.globalData.belongToPlatform = obj.platformId;
			app.globalData.orderInfo.orderId = obj.id;
			app.globalData.contractStatus = obj.contractStatus;
			app.globalData.orderStatus = obj.selfStatus;
			app.globalData.orderInfo.shopProductId = obj.shopProductId;
			app.globalData.signAContract === -1;
			util.weChatSigning(res);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 恢复签约
	async restoreSign (obj) {
		const result = await util.getDataFromServersV2('consumer/order/query-contract', {
			orderId: obj.id
		});
		if (!result) return;
		if (result.code === 0) {
			app.globalData.signAContract = 1;
			// 签约成功 userState: "NORMAL"
			if (result.data.contractStatus !== 1) {
				if (result.data.version === 'v3') {
					if (result.data.contractId) {
						wx.navigateToMiniProgram({
							appId: 'wxbcad394b3d99dac9',
							path: 'pages/etc/index',
							extraData: {
								contract_id: result.data.contractId
							},
							success () {},
							fail (e) {
								// 未成功跳转到签约小程序
								util.showToastNoIcon('调起微信签约小程序失败, 请重试！');
							}
						});
					} else {
						await this.weChatSign(obj);
					}
				} else {
					await this.weChatSign(obj);
				}
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	handleCancel () {
		wx.navigateBack({
			delta: 1
		});
	},
	// 开始
	touchStart (e) {
		this.lineBegin(e.touches[0].x, e.touches[0].y);
	},
	// 移动
	touchMove (e) {
		if (this.data.beginDraw) {
			this.addPointInLine(e.touches[0].x, e.touches[0].y);
			context.draw(true); // true 本次绘制接着上一次绘制  false 清除上次绘制
		}
	},
	// 结束
	touchEnd (e) {
		console.log(e);
		this.lineEnd();
	},
	// 错误返回
	canvasErrorBack (e) {
		util.showToastNoIcon('签名失败，请稍后重试！');
	},
	// 开始划线
	lineBegin (x, y) {
		context.beginPath();
		this.setData({
			beginDraw: true,
			startX: x,
			startY: y
		});
		this.addPointInLine(x, y);
	},
	// 增加点
	addPointInLine (x, y) {
		context.moveTo(this.data.startX, this.data.startY);
		context.lineTo(x, y);
		context.stroke(); // 划弧线
		this.setData({
			startX: x,
			startY: y
		});
	},
	lineEnd () {
		context.closePath(); // 关闭当前路径
		this.beginDraw = false;
		this.setData({
			strokeNum: this.data.strokeNum + 1,
			beginDraw: false
		});
	}
});
