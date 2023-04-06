Component({
	data: {
	},
	ready () {
	},
	methods: {
		async onGetPhoneNumber (e) {
			const that = this;
			// 允许授权
			if (e.detail.errMsg === 'getPhoneNumber:ok') {
				console.log(e);
				that.triggerEvent('PhoneInfo', e.detail);
			}
		}
	}
});
