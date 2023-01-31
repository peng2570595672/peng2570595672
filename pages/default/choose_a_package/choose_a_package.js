const util = require('../../../utils/util.js');
const app = getApp();

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		isFade: false,
		activeIndex: -1,
		isCloseUpperPart: -1,
		basicServiceList: [{
				title: 'ETC设备与卡片',
				tips: '包邮',
				ico: 'https://file.cyzl.com/g001/M00/BD/0C/oYYBAGPY2keAfmvUAAABdQBuYIY183.png'
			},
			{
				title: '设备质保一年',
				ico: 'https://file.cyzl.com/g001/M00/BD/0C/oYYBAGPY2keAfmvUAAABdQBuYIY183.png'
			},
			{
				title: '开具通行费发票',
				ico: 'https://file.cyzl.com/g001/M00/BD/0C/oYYBAGPY2keAfmvUAAABdQBuYIY183.png'
			},
			{
				title: '高速通行9.5折',
				ico: 'https://file.cyzl.com/g001/M00/BD/0C/oYYBAGPY2keAfmvUAAABdQBuYIY183.png'
			}
		],
		shopProductList: [],
		isConfirm: false
	},

	onLoad (options) {},

	onShow () {
		this.getShopProduct();
	},
	// 测试------------------------------------------------
	test (e) {
		let isFade = e.currentTarget.dataset.index !== this.data.activeIndex;
		this.setData({
			isFade,
			activeIndex: isFade ? e.currentTarget.dataset.index : -1,
			isCloseUpperPart: isFade ? e.currentTarget.dataset.index : -1,
			isConfirm: false
		});
	},
	test1 (e) {
		this.setData({
			isCloseUpperPart: -1
		});
	},

	test2 () {
		if (this.data.activeIndex === -1) {
			return util.showToastNoIcon('亲，请选套餐哦');
		}
		let isConfirm = !this.data.isConfirm;
		this.setData({
			isConfirm
		});
	},

	test3 (e) {
		if (this.data.activeIndex === -1) {
			util.showToastNoIcon('亲，请选套餐哦');
		} else if (!e.currentTarget.dataset.isconfirm) {
			util.showToastNoIcon('请同意并勾选协议');
		} else {
			util.showToastNoIcon('请支付');
		}
	},

	async getShopProduct () {
		const params = {
			areaCode: '110000',
			memberId: '1022630259146620928',
			needRightsPackageIds: true,
			platformId: '500338116821778434',
			productType: 2,
			shopId: '611607716116299776',
			vehType: 1
		};
		const result = await util.getDataFromServersV2('consumer/system/get-usable-product', params,'POST',false);
		if (result.code === 0) {
			this.setData({
				shopProductList: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},

	// end-------------------------------------------------

	onUnload () {

	}
});
