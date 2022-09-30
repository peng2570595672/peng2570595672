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
		wrapper: false,
		parames: null
	},
	methods: {
		ok (e) {
			this.triggerEvent('onHandle1');
		},
		show (obj) {
			this.setData({
				mask: true,
				wrapper: true,
				parames: obj
			});
		},
		noShow () {
			this.setData({
				wrapper: false,
				mask: false
			});
			return this.data.parames;
		},
		hide (e,flag) {
			this.setData({
				wrapper: false,
				mask: false
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
