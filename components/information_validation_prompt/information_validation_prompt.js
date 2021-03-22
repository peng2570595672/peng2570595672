Component({
	properties: {
		promptObject: {
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
			console.log(this.data.promptObject)
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
