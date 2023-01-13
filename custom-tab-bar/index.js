const app = getApp();
const util = require('../utils/util.js');
Component({
	data: {
		selected: '0',
		index: '0',
		color: '#ccc', // 颜色
		selectedColor: '#252525', // 被选中颜色
		list: [{
				'pagePath': '/pages/Home/Home',
				'text': '首页',
				'iconPath': 'https://file.cyzl.com/g001/M00/B5/7C/oYYBAGO9BUuAQSYeAAABmpSmZv4643.png',
				'selectedIconPath': 'https://file.cyzl.com/g001/M00/B5/7C/oYYBAGO9BUuAQSYeAAABmpSmZv4643.png'
			},
			{
				'pagePath': '/pages/etc_handle/etc_handle',
				'text': 'ETC办理',
				'iconPath': 'https://file.cyzl.com/g001/M00/B5/7C/oYYBAGO9BUuAQSYeAAABmpSmZv4643.png',
				'selectedIconPath': 'https://file.cyzl.com/g001/M00/B5/7C/oYYBAGO9BUuAQSYeAAABmpSmZv4643.png'
			},
			{
				'pagePath': '/pages/membershipCertificate/membershipCertificate',
				'text': '会员券',
				'iconPath': 'https://file.cyzl.com/g001/M00/B5/7C/oYYBAGO9BUuAQSYeAAABmpSmZv4643.png',
				'selectedIconPath': 'https://file.cyzl.com/g001/M00/B5/7C/oYYBAGO9BUuAQSYeAAABmpSmZv4643.png'
			},
			{
				'pagePath': '/pages/my/index',
				'text': '我的',
				'iconPath': 'https://file.cyzl.com/g001/M00/B5/7C/oYYBAGO9BUuAQSYeAAABmpSmZv4643.png',
				'selectedIconPath': 'https://file.cyzl.com/g001/M00/B5/7C/oYYBAGO9BUuAQSYeAAABmpSmZv4643.png'
			}
		],
		isFade: false,
		counts: 0
	},
	attached () {},
	methods: {
		switchTab (e) {
			const url = e.currentTarget.dataset.path;
			let index = e.currentTarget.dataset.index;
			if (index !== this.data.index) {
				this.setData({
					selected: e.currentTarget.dataset.index,
					index: -1
				});
				// 根据index判断，发布是渲染的时候是没有url的
				if (url) {
					wx.switchTab({
						url: url
					});
				}
			}
		}
	}
});
