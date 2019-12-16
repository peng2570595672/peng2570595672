/**
 * @author 狂奔的蜗牛
 * @desc 行驶证拍照
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		type: 0,// 0 行驶证正面 1行驶证反面 2 车头45度
		title: '车辆行驶证-主页',
		picPath: '/pages/default/assets/driving_license_face_border.png',
		retry: false
	},
	onLoad (options) {
		let reg = new RegExp(`^(0|1|2)$`);
		if (reg.test(options.type)) {
			this.setData({
				type: parseInt(options.type)
			});
			this.setData({
				picPath: this.data.type === 1 ? '/pages/default/assets/driving_license_back_border.png' : this.data.type === 2 ? '/pages/default/assets/car_head_45.png' : '/pages/default/assets/driving_license_face_border.png',
				title: this.data.type === 1 ? '车辆行驶证-副页' : this.data.type === 2 ? '车辆45度照片' : '车辆行驶证-副页'
			});
		}

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
		// const ctx = wx.createCameraContext();
		// ctx.takePhoto({
		// 	quality: 'high',
		// 	success: (res) => {
		// 		console.log(res);
		// 	},
		// 	fail: (res) => {
		// 		console.log(res);
		// 	}
		// });
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
		this.setData({
			type: index,
			picPath: index === 1 ? '/pages/default/assets/driving_license_back_border.png' : index ? '/pages/default/assets/car_head_45.png' : '/pages/default/assets/driving_license_face_border.png',
			title: index === 1 ? '车辆行驶证-副页' : index ? '车辆45度照片' : '车辆行驶证-副页',
			retry: true
		});
	}
});
