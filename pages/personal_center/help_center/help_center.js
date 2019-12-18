const util = require('../../../utils/util.js');
Page({
	data: {
		tabIndex: 0,
		datas: [
			{
				title: '申办资料',
				fold: false,
				sub: [
					{
						title: `如何成为ETC+会员`,
						des: [
							{content: '为保障您的车辆不被他人用以申办ETC，需要上传车辆的行驶证和车主身份证照片、车头照，企业用户还需上传营业执照照片; '},
							{content: '为保障您的车辆不被他人用以申办ETC，需要上传车辆的行驶证和车主身份证照片、车头照，企业用户还需上传营业执照照片; '},
							{content: '为保障您的车辆不被他人用以申办ETC，需要上传车辆的行驶证和车主身份证照片、车头照，企业用户还需上传营业执照照片; '},
							{content: '为保障您的车辆不被他人用以申办ETC，需要上传车辆的行驶证和车主身份证照片、车头照，企业用户还需上传营业执照照片; '},
							{content: '为保障您的车辆不被他人用以申办ETC，需要上传车辆的行驶证和车主身份证照片、车头照，企业用户还需上传营业执照照片; '},
							{content: '为保障您的车辆不被他人用以申办ETC，需要上传车辆的行驶证和车主身份证照片、车头照，企业用户还需上传营业执照照片; '},
							{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'}
						]
					},
					{
						title: '审核资料说明',
						des: [
							{content: '为保障您的车辆不被他人用以申办ETC，需要上传车辆的行驶证和车主身份证照片、车头照，企业用户还需上传营业执照照片; '},
							{content: ' 您申办微信的微信实名制认证姓名、车主姓名、身份证姓名、绑定银行卡姓名必须为同一人方能办理。'}
						]
					},
					{
						title: '资料审核不通过',
						des: '资料审核不通过，您可以在查看办理进度界面，修改资料后提交重新进行审核。'
					},
					{
						title: '之前办理过ETC卡，是否可以办理？',
						des: '您需要将您之前办理的ETC卡片、OBU设备均进行注销后，就可以正常办理。'
					},
					{
						title: '申办车辆条件',
						des: '您的车牌不属于蓝牌、绿牌或渐变绿其中的一种或您的车型为货车、皮卡车、摩托车时，暂时无法为您提供办理。现阶段给您带来不便，敬请谅解。'
					}
				]
			},
			{
				title: '费用相关',
				fold: true,
				sub: [
					{
						title: '扣费失败常见原因',
						des: '由于微信免密代扣的限制,每日最多代扣20笔通行费，单笔不超过1000元。超出限制的订单将代扣失败,请及时手动支付；若账户欠费或解绑免密,将立即停用服务。逾期未还款未重新绑定免密的用户,将列入高速联网黑名单,并依法追究相关责任。'
					},
					{
						title: '如何补交欠费',
						des: '在“ETC+”小程序首页，点击补缴提示弹框进行微信支付还款；或在“ETC+”小程序-个人中心,点击【ETC账单】,按提示进行微信支付还款。还款成功后，将于1-3个工作日内解除高速联网黑名单。'
					},
					{
						title: '扣费延迟说明',
						des: '通行扣费通知会有延迟,通常会在通行后的1-7个工作日内通过ETC+小程序—个人中心—ETC账单处获取扣费账单信息。'
					},
					{
						title: 'ETC通行优惠',
						des: '交通运输部办公厅印发《关于大力推动高速公路ETC发展应用工作的通知》要求，从7月1日起，ETC用户全国享有不低于95折的通行优惠政策。'
					}
				]
			},
			{
				title: '安装指引',
				fold: true,
				sub: [
					{
						title: '安装指引',
						des: '您在收到ETC专用电子标签（OBU）设备后,可根据OBU盒子内的说明手册,按照流程提示进行自助安装激活；或通过安装指引卡片，关注ETC+微信公众号，回复对应编号查看安装激活说明。安装注意事项请参考设备说明书或小程序安装指引的推荐区域,注意挡风玻璃上请勿有异物遮挡电子标签设备。'
					},
					{
						title: '激活指引',
						des: '您在收到ETC专用电子标签（OBU）设备后,可根据OBU盒子内的说明手册,按照流程提示进行自助安装激活；或通过安装指引卡片，关注ETC+微信公众号，回复对应编号查看安装激活说明。若遇见激活相关问题,请致电4001096138咨询处理；激活成功后,请勿拔下或移动电子标签设备,否则会导致电子标签设备失效,进而造成无法使用ETC服务。'
					}
				]
			},
			{
				title: '发货相关',
				fold: true,
				sub: [
					{
						title: '为什么要填收货地址',
						des: '您的申办审核通过后，我们将免费您邮寄ETC专用电子标签设备到您填写的邮寄地址。'
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
				]
			},
			{
				title: '设备相关',
				fold: true,
				sub: [
					{
						title: '设备售后说明',
						des: '(1) 设备保修期多久\n　　ETC专用电子标签设备保修期为3年。\n\n(2) 设备质量问题怎么办\n　　在非人为情况下，若保修期内存在质里问题，请联系在线客服或客服热线处理。\n\n(3) 电子标签掉落怎么办\n　　ETC专用电子标签设备掉落会导致设备失效,具体请联系线客服或客服热线处理。'
					},
					{
						title: '使用时需要打开蓝牙设备吗',
						des: '蓝牙仅在您激活时使用，通行时无需连接蓝牙设备。'
					},
					{
						title: 'OBU（电子标签）设备如何更换电池',
						des: '您的电子标签设备是利用太阳能充电，无需更换电池设备。'
					}
				]
			}
		],
		showDetailMask: false,
		showDetailWtapper: false,
		showScroll: false,
		detailsContent: '',
		fatherHeight: '',
		childHeight: ''
	},
	// 去搜索
	goSearch () {
		util.go('/pages/personal_center/search_help/search_help');
	},
	// tab切换
	tab (e) {
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		this.setData({
			tabIndex: index
		});
	},
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
	}
});
