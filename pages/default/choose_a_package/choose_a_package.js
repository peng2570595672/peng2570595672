const util = require('../../../utils/util.js');
const app = getApp();

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		isFade: false,
		activeIndex: -1,
		isCloseUpperPart: false, // 控制 详情是否显示
		isCloseUpperPart1: false, // 控制 详情是否显示
		isCloseUpperPart2: false, // 控制 详情是否显示
		basicServiceList: [{
				title: 'ETC设备与卡片',
				tips: '包邮',
				ico: 'https://file.cyzl.com/g001/M01/BE/6E/oYYBAGPbUnKAYG8pAAABdQBuYIY953.png'
			},
			{
				title: '设备质保一年',
				ico: 'https://file.cyzl.com/g001/M01/BE/6E/oYYBAGPbUnKAYG8pAAABdQBuYIY953.png'
			},
			{
				title: '开具通行费发票',
				ico: 'https://file.cyzl.com/g001/M01/BE/6E/oYYBAGPbUnKAYG8pAAABdQBuYIY953.png'
			},
			{
				title: '高速通行9.5折',
				ico: 'https://file.cyzl.com/g001/M01/BE/6E/oYYBAGPbUnKAYG8pAAABdQBuYIY953.png'
			}
		],
		equityShop: [
			// 权益套餐的 数据展示
			{
				shopName: '芒果TV',
				couponOffset: '券抵2元',
				shopImg: 'https://file.cyzl.com/g001/M07/B1/B5/oYYBAGO3kWiALcwoAAAG0YIQbVI397.png',
				couponPrice: 10
			},
			{
				shopName: 'QQ音乐',
				couponOffset: '券抵5元',
				shopImg: 'https://file.cyzl.com/g001/M07/B1/B5/oYYBAGO3kUWAc_EDAAAHrHwpCD0833.png',
				couponPrice: 22.68
			},
			{
				shopName: 'youku',
				couponOffset: '券抵8元',
				shopImg: 'https://file.cyzl.com/g001/M00/B1/B4/oYYBAGO3kQOAf9V6AAAFnKab-Vg960.png',
				couponPrice: 38.08
			}
		],
		shopProductList: [],
		isConfirm: false,
		scrollTops: 0,
		nodeHeightList: [], // 存储节点高度 集合
		phoneType: 2
	},

	onLoad (options) {},

	onShow () {
		this.getShopProduct();
	},
	onPageScroll (e) {
		this.setData({
			scrollTops: e.scrollTop
		});
	},
	// 测试------------------------------------------------
	test (e) { // 点击高亮
		let that = this;
		let isFade = e.currentTarget.dataset.index !== that.data.activeIndex;
		// 控制点击 套餐高亮
		that.setData({
			isFade,
			activeIndex: isFade ? e.currentTarget.dataset.index : -1,
			isConfirm: false
		});
		if (isFade) { // 当套餐高亮时，默认展开 详情
			this.setData({
				isCloseUpperPart1: true,
				isCloseUpperPart2: false
			});
		} else {
			this.setData({
				isCloseUpperPart: e.currentTarget.dataset.index,
				isCloseUpperPart1: false,
				isCloseUpperPart2: false
			});
		}
		// 点击套餐 让套餐模块置顶 一定的距离
		if (!isFade) {
			return false;
		} else {
			this.controllShopProductPosition(e.currentTarget.dataset.index);
		}
	},
	test1 (e) { // 展开和收起
		let index = e.currentTarget.dataset.index[0];
		let activeIndex = e.currentTarget.dataset.index[2];
		let isCloseUpperPart = e.currentTarget.dataset.index[1];
		let flag = this.data.isCloseUpperPart1;
		let flag2 = this.data.isCloseUpperPart2;
		if (index === activeIndex) { // 选中套餐 点击 展开和收起 的控制
			this.setData({
				isCloseUpperPart1: !flag,
				isCloseUpperPart2: isCloseUpperPart !== index ? false : !flag2
			});
		} else { // 未选中套餐 点击 展开和收起 的控制
			this.setData({
				isCloseUpperPart: index,
				isCloseUpperPart1: false,
				isCloseUpperPart2: isCloseUpperPart !== index ? true : !flag2
			});
		}
	},

	test2 () {
		if (this.data.activeIndex === -1) {
			return util.showToastNoIcon('亲，请选套餐哦');
		}
		let isConfirm = !this.data.isConfirm;
		this.setData({
			isConfirm
		});
		this.controllShopProductPosition(this.data.activeIndex);
	},

	test3 (e) {
		if (this.data.activeIndex === -1) {
			util.showToastNoIcon('亲，请选套餐哦');
		} else if (!e.currentTarget.dataset.isconfirm) {
			util.showToastNoIcon('请阅读相关协议并勾选同意');
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
		const result = await util.getDataFromServersV2('consumer/system/get-usable-product', params, 'POST', false);
		if (result.code === 0) {
			this.setData({
				shopProductList: [
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					},
					{
						productLogo: 'https://file.cyzl.com/g001/M05/3B/E5/oYYBAF58DfWAH6k9AAAbWZuJ_0M692.png',
						productName: '通通券联名套餐',
						pledgePrice: 10000,
						fullName: '默认开通通通券连续包月会员',
						packageName: '120元出行无忧券',
						rightsPackageIds: ['1046938140865994752']
					}

				]
			});
			this.getNodeHeight(this.data.shopProductList.length);
		} else {
			util.showToastNoIcon(result.message);
		}
	},

	// 获取节点的高度
	getNodeHeight (num) {
		let that = this;
		let nodeHeightList = [];
		for (let index = 0; index < num; index++) {
			let allIndex = 'module' + index;
			wx.createSelectorQuery().select(`.${allIndex}`).boundingClientRect(function (rect) {
				// console.log('节点信息: ',rect);
				nodeHeightList.push(rect.height);
				that.setData({
					nodeHeightList
				});
			}).exec();
		}
		wx.getSystemInfo({
			success: (res) => {
				let arr = [
					['iPhone 5'],['Nexus 5'],['iPhone 6/7/8','iPhone X','iPhone 12/13 mini','iPhone 12/13 (Pro)','Mac 13-inch and below','Mac 15-inch'],
					['iPhone XR','iPhone XS Max','Mac 21-inch and above','Nexus 5X','Nexus 6','iPhone 6/7/8 Plus'],['iPhone 12/13 Pro Max','iPhone 14 Pro Max'],
					['Windows'],['iPad'],['iPad Pro 10.5-inch'],['iPad Pro 12.9-inch']
				];
				console.log(res.model);
				for (let index = 0; index < 9; index++) {
					if (arr[index].includes(res.model)) {
						return that.setData({
							phoneType: index
						});
					}
				}
			}
		});
	},
	// 控制 选中套餐 的位置
	controllShopProductPosition (eIndex) {
		let flags = 'module' + eIndex;
		let topValue = 0;
		let that = this;
		for (let index = 0; index < that.data.nodeHeightList.length; index++) {
			if (index < eIndex) {
				topValue += that.data.nodeHeightList[index];
			}
		}
		let num = [17,19,20,21,22,25,39,43,52];	// 减少选中模块距离顶部的 中间值,是根据手机型号 来获取对应的值
		wx.pageScrollTo({
			selector: `.${flags}`,
			scrollTop: topValue + that.data.activeIndex * num[that.data.phoneType] - that.data.activeIndex,
			duration: 200
		});
	},

	// end-------------------------------------------------

	onUnload () {

	}
});
