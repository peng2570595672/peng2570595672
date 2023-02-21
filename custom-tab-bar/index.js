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
				'iconPath': 'https://file.cyzl.com/g001/M01/C7/64/oYYBAGPrT8KAUf0zAAAK0gShQtE694.png',
				'selectedIconPath': 'https://file.cyzl.com/g001/M01/C7/65/oYYBAGPrT-qALbyAAAAMEqUNATM774.png'
			},
			{
				'pagePath': '/pages/etc_handle/etc_handle',
				'text': 'ETC办理',
				'iconPath': 'https://file.cyzl.com/g001/M01/C7/65/oYYBAGPrUASALSs-AAAL6GWOYSs692.png',
				'selectedIconPath': 'https://file.cyzl.com/g001/M01/C7/65/oYYBAGPrUBeANJ0PAAANz35xPUQ701.png'
			},
			// {
			// 	'pagePath': '/pages/membershipCertificate/membershipCertificate',
			// 	'text': '会员券',
			// 	'iconPath': 'https://file.cyzl.com/g001/M01/C7/65/oYYBAGPrUCiAFrfGAAAK2PKj_tE701.png',
			// 	'selectedIconPath': 'https://file.cyzl.com/g001/M01/C7/65/oYYBAGPrUDuAcRN5AAAMBHnGARw079.png'
			// },
			{
				'pagePath': '/pages/my/index',
				'text': '我的',
				'iconPath': 'https://file.cyzl.com/g001/M01/C7/65/oYYBAGPrUFGAe0RkAAAJn-d-Bfc662.png',
				'selectedIconPath': 'https://file.cyzl.com/g001/M01/C7/65/oYYBAGPrUHaAHqTgAAAKSbNvinE427.png'
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
