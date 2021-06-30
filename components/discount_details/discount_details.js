const app = getApp();
Component({
	properties: {},
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
			}, 400);
		}
	}
});
