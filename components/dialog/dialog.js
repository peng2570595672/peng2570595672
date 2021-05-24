Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
		dialogContent: {
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
			this.triggerEvent('onHandle');
		},
		show () {
			this.setData({
				mask: true,
				wrapper: true
			});
		},
		hide (e,flag) {
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				this.triggerEvent('cancelHandle');
			}, 400);
		}
	}
});
