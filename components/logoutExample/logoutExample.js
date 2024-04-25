Component({
	data: {
		innerShow: false,
		type: 0
	},
	methods: {
		show (info) {
			this.setData({
				type: info.type,
				innerShow: true
			});
		},
		handleClose () {
			this.setData({
				innerShow: false
			});
		}
	}
});
