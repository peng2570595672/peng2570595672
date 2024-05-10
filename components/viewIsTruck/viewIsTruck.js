const util = require('../../utils/util.js');
Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
		viewTc: {
			type: Object,
			value: {}
		}
	},

	data: {
		mask: false,
		wrapper: false,
		isShow: false
	},
	methods: {
		ok (e) {
			this.hide(e, true);
		},
		show () {
			let height = wx.getSystemInfoSync().screenHeight / wx.getSystemInfoSync().screenWidth;
			console.log();
			this.setData({
				mask: true,
				wrapper: true,
				isShow: (750 * height.toFixed(3)) < 1500 ? true : false
			});
		},
		hide (e) {
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				this.triggerEvent('onHandle');
			}, 400);
		},
		chooseAxleNum (e) {
			let Num = +e.currentTarget.dataset.value;
			this.triggerEvent('getAxleNum', Num);
			this.hide(e);
		},
		btnMovingIntegral (e) {
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				this.triggerEvent('btnMovingIntegral', e);
			}, 400);
		}
	}
});
