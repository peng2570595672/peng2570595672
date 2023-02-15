const util = require('../../utils/util.js');

Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
		tipObj: {
			type: Object,
			value: {}
		}
	},

	data: {
		mask: false,
		wrapper: false
	},
	methods: {
		ok (e) {
			this.hide(e, true);
		},
		go (e) {	// 跳转 指定页面
			let src = e.currentTarget.dataset.src;
			util.go(src);
			this.setData({
				mask: false,
				wrapper: false
			});
		},
		show () {
			this.setData({
				mask: true,
				wrapper: true
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
		}
	}
});
