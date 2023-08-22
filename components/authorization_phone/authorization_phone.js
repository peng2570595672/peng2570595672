Component({
	data: {
	},
	ready () {
	},
	methods: {
		async onGetPhoneNumber (e) {
			if (e.detail.errno === 1400001) {
				util.showToastNoIcon('开发方预存费用不足！');
				return;
			}
			const that = this;
			// 允许授权
			if (e.detail.errMsg === 'getPhoneNumber:ok') {
				console.log(e);
				that.triggerEvent('PhoneInfo', e.detail);
			}
		}
	}
});
