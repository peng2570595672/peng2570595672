/**
 * @author 狂奔的蜗牛
 * @desc 选择支付方式
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		type: 1,// 0 银行卡 1身份证正面 2 身份证反面
		picPath: '/pages/default/assets/bank_border.png'
	},
	onLoad (options) {
		let reg = new RegExp(`^(0|1|2)$`);
		if (reg.test(options.type)) {
			this.setData({
				type: parseInt(options.type)
			});
			this.setData({
				picPath: this.data.type === 1 ? '/pages/default/assets/id_card_face_border.png' : this.data.type === 2 ? '/pages/default/assets/id_card_back_border.png' : '/pages/default/assets/bank_border.png'
			});
		}
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColorBottom: '#33333C'
		});
	},
	// 相机初始化失败
	cameraErrorHandle (e) {
		console.log(e);
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
				console.log(res);
			},
			fail: (res) => {
				console.log(res);
			}
		});
	},
	// 切换身份证正反两面
	onClickSwitchHandle (e) {
		let type = e.currentTarget.dataset.type;
		type = parseInt(type);
		this.setData({
			type,
			picPath: type === 1 ? '/pages/default/assets/id_card_face_border.png' : type === 2 ? '/pages/default/assets/id_card_back_border.png' : '/pages/default/assets/bank_border.png'
		});
	}
});
