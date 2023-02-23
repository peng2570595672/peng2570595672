const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		listOne: [{
				id: 1,
				title1: 'ETC设备',
				title2: '包含OUB设备一台及卡片一张',
				text: '当您的ETC激活以后，即可全国通行，过站免排队，全国高速通行95折，如部分省份高速或路段还有其他优惠可叠加同享。',
				bgImg: 'https://file.cyzl.com/g001/M01/C8/62/oYYBAGP0n6CACqw2AAFS1cNEZfY540.jpg'
			},
			{
				id: 2,
				title1: '整机保修',
				title2: '合约期内只换不修',
				text: '合约期内只换不修',
				bgImg: 'https://file.cyzl.com/g001/M01/C8/62/oYYBAGP0oCyAQB_TAAFddsoJEGA643.jpg'
			},
			{
				id: 3,
				title1: '在线客服',
				title2: '全天候服务支持',
				text: '在线客服：尊敬的车主，我们为您7*24H在线专人客服，如有疑问点击这里立即咨询',
				bgImg: 'https://file.cyzl.com/g001/M01/C8/62/oYYBAGP0oBCAbXRLAAE-kHOi4kA051.jpg'
			},
			{
				id: 4,
				title1: '权益商城',
				title2: '全天候服务支持',
				text: '我们准备了涵盖出行、生活、影视听娱乐、免税商品等多项权益，任供ETC车主用户消费及使用',
				bgImg: 'https://file.cyzl.com/g001/M01/C8/62/oYYBAGP0n_qAP8hbAAFIgtccSOc371.jpg'
			}
		],
		// 轮播图当前的下标
		current: 0,
		// 是否自动播放轮播图
		autoplay: false,
		isVip: undefined
	},

	onLoad (options) {
		this.setData({
			isVip: options.isVip === 'true' ? true : false
		});
	},

	onShow () {

	},

	// 监听轮播图的下标
	monitorCurrent: function (e) {
		let current = e.detail.current;
		this.setData({
			current: current
		});
	},

	goOnlineServer () {
		// 未登录
		if (!app.globalData.userInfo.accessToken) {
			util.go('/pages/login/login/login');
			return;
		}
		wx.uma.trackEvent('index_for_service');
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	handleMall () {
		const url = `https://${app.globalData.test ? 'etctest' : 'etc'}.cyzl.com/${app.globalData.test ? 'etc2-html' : 'wetc'}/etc_life_rights_and_interests/index.html#/?auth=${app.globalData.userInfo.accessToken}&platformId=${app.globalData.platformId}`;
		util.go(`/pages/web/web/web?url=${encodeURIComponent(url)}`);
	}

});
