/**
 * @author 狂奔的蜗牛
 * @desc 填写车牌和收货信息
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		showKeyboard: false, // 是否显示键盘
		currentIndex: -1, // 当前选中的输入车牌位置
		carNoStr: '', // 车牌字符串
		carNo: ['贵', '', '', '', '', '', '', ''], // 车牌对应的数组
	},
	// 下一步
	next () {
		util.go('/pages/default/payment_way/payment_way');
	},
	// 车牌输入回调
	valueChange (e) {
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.indexMethod(e.detail.index, this.data.currentIndex);
		}
		this.setData({
			carNo: e.detail.carNo,
			carNoStr: e.detail.carNo.join(''),
			currentIndex: e.detail.index,
			showKeyboard: e.detail.show
		});
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.showMethod(this.data.showKeyboard);
		}
	},
	// 点击某一位输入车牌
	setCurrentCarNo (e) {
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.indexMethod(index, this.data.currentIndex);
		}
		this.setData({
			currentIndex: index
		});
		if (!this.data.showKeyboard) {
			this.setData({
				showKeyboard: true
			});
			if (app.globalData.SDKVersion < '2.6.1') {
				let keyboard = this.selectComponent('#keyboard');
				keyboard.showMethod(this.data.showKeyboard);
			}
		}
	},
});
