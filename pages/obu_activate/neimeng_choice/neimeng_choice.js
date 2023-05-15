const app = getApp();
const util = require('../../../utils/util.js');
const obuMenu = require('../../../utils/obuMenu.js');
Page({
	data: {
		list: [
			{name: '铭创（无卡式）', subTitle: '质保3年/高速通行95折', img: 'https://file.cyzl.com/g001/M01/DD/02/oYYBAGRd25yAePUUAAACak0wmzQ186.png'},
			{name: '埃特斯（插卡式）', subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
			{name: '天地融（插卡式）', subTitle: '质保3年/高速通行95折', img: '../images/etc.png'},
			// {name: '万集 OBU', subTitle: '质保3年/高速通行95折', img: '/images/etc.png'},
			{name: '铭创（插卡式）', subTitle: '质保3年/高速通行95折', img: '../images/etc.png'}
		],
		activeIndex: -1
	},
	onLoad () {
	},
	onShow () {
	},
	handleDeviceType (e) {
		const index = +e.currentTarget.dataset.index;
		this.setData({
			activeIndex: index
		});
		app.globalData.choiceDeviceIndex = index;
		if (index) {
			util.go('/pages/obu_activate/guide/index');
		} else {
			util.go('/pages/obu_activate/neimeng_guide/neimeng_guide');
		}
	}
});
