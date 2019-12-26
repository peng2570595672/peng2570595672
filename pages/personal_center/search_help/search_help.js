const util = require('../../../utils/util.js');
Page({
	data: {
		list: [
			{
				title: '为什么要填收货地址',
				des: [
					{content: '为保障您的车辆不被他人用以申办ETC，需要上传车辆的行驶证和车主身份证照片、车头照，企业用户还需上传营业执照照片; '},
					{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'},
					{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'},
					{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'},
					{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'},
					{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'},
					{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'},
					{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'},
					{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'},
					{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'},
					{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'},
					{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'}
				]
			},
			{
				title: '快递进度查询',
				des: '您的申办审核通过后,并且选择的为线上办理。我们将邮寄您的ETC设备,您可以在【我的ETC】-【查看办理进度】界面查看快递信息。'
			},
			{
				title: '设备功能说明',
				des: 'ETC专用电子标签设备包括蓝牙OBU设备及ETC卡片,安装激活后可实现ETC应用场景的不停车通行。'
			},
			{
				title: '是否包邮',
				des: '是的，当您申办成功后，您设备的邮寄费用由我们为您承担。但若因您的操作导致设备需邮寄返回，费用需要您自行承担。'
			}
		],
		showDetailMask: false,
		showDetailWtapper: false,
		childHeight: '',
		fatherHeight: '',
		detailsContent: ''
	},
	// 弹出详情
	// 弹出详情
	showDetail (e) {
		let content = e.currentTarget.dataset['content'];
		this.setData({
			detailsContent: content,
			showDetailMask: true,
			showDetailWtapper: true
		});
		let fatherHeight = wx.createSelectorQuery();
		fatherHeight.select('.details-list').boundingClientRect();
		fatherHeight.exec(res => {
			this.setData({
				fatherHeight: res[0].height
			});
		});
		let childHeight = wx.createSelectorQuery();
		childHeight.select('.details-list-box').boundingClientRect();
		childHeight.exec(res => {
			this.setData({
				childHeight: res[0].height
			});
		});
	},
	// 关闭详情
	hide () {
		this.setData({
			showDetailWtapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 400);
	},
	// 搜索
	bindconfirm (e) {
		const that = this;
		const discountName = e.detail.value['search - input'] ? e.detail.value['search - input'] : e.detail.value;
		console.log('e.detail.value', discountName);
	}
});
