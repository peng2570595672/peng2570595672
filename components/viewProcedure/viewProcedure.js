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
		wrapper: false
	},
	methods: {
		ok (e) {
			this.hide(e, true);
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
