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
		wrapper: false,
		handlingProcess: [
			{icon: 'https://file.cyzl.com/g001/M01/C7/75/oYYBAGPraQeAd8VcAAANbmC6Sdo255.png' ,title: '车主身份证'},
			{icon: 'https://file.cyzl.com/g001/M01/C7/A2/oYYBAGPs5VGAN4KUAAAf_5IXjB0976.png' ,title: '行驶证'}
			// {icon: 'https://file.cyzl.com/g001/M02/19/71/oYYBAGVduHeAPvygAAAPuz_4Kts400.svg' ,title: '车头照'}
		],
		processList: [{
				title: '填写基础信息',
				content: '填写车牌和收货信息。'
			},
			{
				title: '选择办理方式',
				content: '多种办理方式按需选择'
			},
			{
				title: '上传证件及签约免密代扣',
				content: '按要求上传对应证件，然后完成通行费代扣签约。'
			},
			{
				title: '高速审核通过，包邮送货到家',
				content: ''
			},
			{
				title: '自助安装激活',
				content: '收到设备后按指引激活ETC，先通行后付费，通行后费用将通过微信代扣。'
			}
		],
		isShow: false
	},
	methods: {
		ok (e) {
			this.hide(e, true);
		},
		show () {
			let height = wx.getSystemInfoSync().screenHeight / wx.getSystemInfoSync().screenWidth;
			console.log();
			this.setData({
				mask: true,
				wrapper: true,
				isShow: (750 * height.toFixed(3)) < 1500 ? true : false
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
		},
		btnMovingIntegral (e) {
			console.log(e);
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				this.triggerEvent('btnMovingIntegral',e);
			}, 400);
		}
	}
});
