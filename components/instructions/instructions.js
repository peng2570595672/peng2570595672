Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
		popupContent: {
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
			this.hide(e,true);
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
				if (flag) {
					this.triggerEvent('onHandle');
				} else {
					this.triggerEvent('cancelHandle');
				}
			}, 400);
		}
	}
});
