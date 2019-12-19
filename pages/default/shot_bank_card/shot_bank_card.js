/**
 * @author 狂奔的蜗牛
 * @desc 选择支付方式
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		type: 2,// 0 银行卡 1身份证正面 2 身份证反面
		picPath: '/pages/default/assets/bank_border.png',
		title: '请拍摄银行卡数字面',
		doAnimate: false,
		style: '',
		pic0: '',
		pic1: '',
		pic2: '',
		pic1IdentifyResult: -1, // 图片识别结果 -1 未知 0成功 1失败
		pic2IdentifyResult: -1
	},
	onLoad (options) {
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
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColorBottom: '#33333C'
		});
	},
	// 相机初始化失败
	onCameraErrorHandle (e) {
		console.log(e);
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
			sourceType: ['album', 'camera'],
			success (res) {
				console.log(res);
			},
			fail: (res) => {
				console.log(res);
			}
		});
	},
	// 拍照
	takePhotoHandle () {
		const ctx = wx.createCameraContext();
		ctx.takePhoto({
			quality: 'high',
			success: (res) => {
				let key = `pic${this.data.type}`;
				let obj = {};
				obj[key] = res.tempImagePath;
				this.setData(obj);
				// 判断是否进行识别
				if (this.data.pic0 || (this.data.pic1 && this.data.pic2)) {
					// 开始识别
					this.identifyResult();
				}
			},
			fail: (res) => {
				util.showToastNoIcon('拍照失败！');
			}
		});
	},
	// 开始识别结果
	identifyResult () {
		util.showLoading({
			title: '识别中...'
		});
		if (this.data.type === 1 || this.data.type === 2) {
			setTimeout(() => {
				wx.hideLoading();
				this.setData({
					pic1IdentifyResult: 0,
					pic2IdentifyResult: 0
				});
			}, 2000);
		}
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
