const util = require('../../utils/util.js');
const app = getApp();
Component({
	properties: {
		current: {
			type: Number,
			value: -1
		}
	},
	data: {
		mask: false,
		wrapper: false,
		regionCode: [],// 区域编码
		listOfPackages: [] // 套餐列表
	},
	methods: {
		// 显示或者隐藏
		switchDisplay (isShow) {
			if (isShow) {
				// 之前已经加载了数据 不再进行加载
				if (this.data.listOfPackages.length === 0) {
					this.init();
				} else {
					this.setData({
						mask: true,
						wrapper: true
					});
				}
			} else {
				this.setData({
					wrapper: false
				});
				setTimeout(() => {
					this.setData({
						mask: false
					});
				}, 400);
			}
		},
		// 点击半透明层
		onClickTranslucentHandle () {
			this.triggerEvent('onClickTranslucentHandle', {});
		},
		// 拦截点击非透明层空白处事件
		onClickCatchHandle () {

		},
		// 点击具体支付方式
		onClickItemHandle (e) {
			let index = e.currentTarget.dataset.index;
			index = parseInt(index);
			this.setData({
				current: index
			});
			let obj = this.data.listOfPackages[index];
			obj['areaCode'] = this.data.regionCode[0];
			this.triggerEvent('onClickItemHandle', {
				targetObj: obj
			});
		},
		// 获取套餐列表
		getListOfPackages (notList) {
			let shopId;
			if (notList) {
				shopId = app.globalData.miniProgramServiceProvidersId;
			} else {
				shopId = app.globalData.otherPlatformsServiceProvidersId ? app.globalData.otherPlatformsServiceProvidersId : app.globalData.miniProgramServiceProvidersId;
			}
			if (app.globalData.isSalesmanPromotion) {
				// 业务员推广&会员券进入
				shopId = app.globalData.salesmanMerchant;
			}
			util.showLoading();
			let params = {
				areaCode: this.data.regionCode[0],
				shopId: shopId
			};
			if (!app.globalData.faceToFacePromotionId) {
				params['productType'] = 2;
			} else {
				params['productType'] = 3;
			}
			util.getDataFromServer('consumer/system/get-usable-product', params, () => {
				util.showToastNoIcon('获取套餐失败!');
			}, (res) => {
				if (res.code === 0) {
					if (res.data.length === 0) {
						// 如果其他服务商过来办理 没有查询到套餐. 1.面对面活动,不处理  2.其他服务商过来,重新加载小程序自带套餐
						if ((app.globalData.isFaceToFaceCCB || app.globalData.isFaceToFaceICBC || app.globalData.isFaceToFaceWeChat) && app.globalData.faceToFacePromotionId) {
							return;
						}
						if (app.globalData.isSalesmanPromotion) {
							util.showToastNoIcon('未查询到套餐，请联系工作人员处理！');
							return;
						}
						if (app.globalData.isJinYiXing) {
							return;
						}
						if (shopId === app.globalData.miniProgramServiceProvidersId) {
							return;
						}
						app.globalData.isServiceProvidersPackage = false; // 该服务商没有套餐
						this.getListOfPackages(true);
					}
					let list = res.data;
					// 面对面活动过滤套餐
					if (app.globalData.faceToFacePromotionId) {
						let faceToFaceList = [];
						list = [];
						faceToFaceList = res.data.find((item) => {
							if (app.globalData.isFaceToFaceCCB) {
								return item.shopProductId === '699045700725501952';
							} else if (app.globalData.isFaceToFaceICBC) {
								return item.shopProductId === '699045657108934656';
							} else {
								return item.shopProductId === '699045676809580544';
							}
						});
						list.push(faceToFaceList);
					}
					this.setData({
						listOfPackages: list
					});
				} else {
					util.showToastNoIcon(res.message);
				}
			}, app.globalData.userInfo.accessToken, () => {
				util.hideLoading();
				this.setData({
					mask: true,
					wrapper: true
				});
			});
		},
		// 定位
		getLocationInfo () {
			util.showLoading();
			wx.getLocation({
				type: 'wgs84',
				success: (res) => {
					util.getAddressInfo(res.latitude, res.longitude, (res) => {
						let info = res.result.ad_info;
						let regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode];
						this.setData({
							regionCode
						});
						// 加载套餐
						this.getListOfPackages();
					}, () => {
						// 加载套餐
						this.getListOfPackages();
					});
				},
				fail: (res) => {
					util.hideLoading();
					console.log(res);
					if (res.errMsg === 'getLocation:fail auth deny' || res.errMsg === 'getLocation:fail authorize no response') {
						util.alert({
							content: '由于您拒绝了定位授权，导致无法获取扣款方式，请允许定位授权！',
							showCancel: true,
							confirmText: '允许授权',
							confirm: () => {
								wx.openSetting();
							}
						});
					}
				}
			});
		},
		// 获取数据
		init () {
			// 是否缓存了定位信息
			let locationInfo = wx.getStorageSync('location-info');
			if (locationInfo) {
				let res = JSON.parse(locationInfo);
				let info = res.result.ad_info;
				// 获取区域编码
				let regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode];
				this.setData({
					regionCode
				});
				// 获取套餐列表
				this.getListOfPackages();
				return;
			}
			// 定位
			this.getLocationInfo();
		}
	}
});
