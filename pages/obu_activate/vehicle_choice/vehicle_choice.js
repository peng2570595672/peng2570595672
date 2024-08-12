const app = getApp();
const util = require('../../../utils/util.js');
const obuMenu = require('../libs/obuMenu.js');
Page({
	data: {
		choiceEquipment: undefined,
		list: []
	},
	onLoad () {
		app.globalData.myEtcList.map(item => {
			item['selfStatus'] = item.isNewTrucks === 1 ? util.getTruckHandlingStatus(item) : util.getStatus(item);
		});
		this.setData({
			list: app.globalData.myEtcList
		});
	},
	onShow () {
	},
	async handleVehicle (e) {
		const index = +e.currentTarget.dataset.index;
		const item = this.data.list[index];
		if (item.obuCardType === 10 && +item.deviceType === 0) {	// 临时针对信科订单处理
			if (item.selfStatus === 3) {
				// app.globalData.orderInfo.orderId = item.id;
				// util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests`);
				util.showToastNoIcon('暂无审核通过的订单');
				return;
			}
			util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${item.id}`);
			return;
		}
		if (item.auditStatus !== 2) {
			util.showToastNoIcon('暂无审核通过的订单');
			return;
		}
		this.setData({
			activeIndex: index
		});
		app.globalData.orderInfo.orderId = item.id;
		const result = await util.getDataFromServersV2('consumer/order/order-detail', {
			orderId: item.id
		});
		let res = await util.getDataFromServersV2('consumer/order/common/get-member-by-carno',{
			carNo: result.data.vehPlates,
			vehColor: result.data.vehColor
		});
		const signed = +(res.data.contractStatus === 1) || res.data.etcContractId === -1;
		if (!signed) {
			this.selectComponent('#noticeDialog').show({
				orderId: item.id,
				alertType: 100,
				btnName: '立即签约',
				popUpType: 2,
				sysPlatform: res.data.sysPlatform,
				title: '车主服务签约提醒',
				text: '您还未完成车主服务签约，请先完成后再激活'
			});
			return;
		}
		let qtLimit = '';
		if (item.obuCardType === 4) {
			qtLimit = JSON.stringify(res.data.qtLimit);
		}
		wx.setStorageSync('baseInfo', {
			orderId: item.id,
			mobilePhone: app.globalData.userInfo.mobilePhone,
			channel: item.obuCardType,
			qtLimit: qtLimit,// 青通卡激活所需
			serverId: item.shopId,
			carNoStr: item.vehPlates,
			obuStatus: item.obuStatus
		});
		// app.globalData.newEmptyObuNo = result.data.orderType === 72 && item.obuCardType !== 1 && item.obuCardType !== 21 && item.obuCardType !== 10 ? result.data.obuNo : '';
		switch (item.obuCardType) {
			case 1:// 贵州 黔通卡
			case 21:
				util.go(`/pages/empty_hair/instructions_gvvz/index?auditStatus=${item.auditStatus}`);
				break;
			case 2:// 内蒙 蒙通卡
			case 23: // 河北交投
				if (!this.data.choiceEquipment) {
					this.setData({
						choiceEquipment: this.selectComponent('#choiceEquipment')
					});
				}
				this.data.choiceEquipment.switchDisplay(true);
				break;
			case 3:	// 山东 鲁通卡
			case 9:	// 山东 齐鲁通卡
				util.go(`/pages/empty_hair/instructions_ujds/index?auditStatus=${item.auditStatus}`);
				break;
			case 4:	// 青海 青通卡
			case 5:// 天津 速通卡
			case 10:// 湖南 湘通卡
				util.go(`/pages/obu_activate/neimeng_choice/neimeng_choice?obuCardType=${item.obuCardType}`);
				break;
			case 8:	// 辽宁 辽通卡
				util.go(`/pages/empty_hair/instructions_lnnk/index?auditStatus=${item.auditStatus}`);
				break;
		}
	},
	goActive () {
		util.go('/pages/obu_activate/vehicle_inquire/vehicle_inquire');
	},
	// 拦截点击非透明层空白处事件
	onClickTranslucentHandle () {
		this.data.choiceEquipment.switchDisplay(false);
	}
});
