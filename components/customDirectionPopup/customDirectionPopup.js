const util = require('../../utils/util.js');
const app = getApp();
Component({
    lifetimes: {},
    properties: {

    },

    data: {
        mask: false, // 控制遮罩层的显示/隐藏
        make: false, // 控制表示层的显示/隐藏
        isBtnClose: true, // 传递过来的参数
        argObj: [{
            title: ''
        }], // 传递过来的参数
        noSliding: false, // 是否禁止底层页面滑动
        // 设备激活 ---start ---
        passTicketList: [ // money: 金额/券额, num： 数量, isEquity：是否是券额
            {money: 10,num: 12,isEquity: false,content: '满20元可用'},
            {money: 100,num: 1,isEquity: true,content: '权益商城抵扣券'}
        ],
        carList: [
            {vehPlates: '粤B 2P2W6',mobilePhone: '13800000000'}
        ],
        isHide: false, // 是否隐藏
        selectedIndex: -1, // 选中模块的索引
        isBtn: false // 顶部按钮是否点击
        // ---end------------------
    },

    methods: {
        show (obj) {
            let isBtnClose = obj.isBtnClose ? obj.isBtnClose : false;
            let argObj = obj.argObj || this.data.argObj;
            if (argObj?.orderId) this.queryOrder(argObj.orderId);
            this.setData({
                mask: true,
                make: true,
                isBtnClose,
                argObj,
                noSliding: true
            });
        },
        hide () {
            let that = this;
            that.setData({
                mask: false
            });
            setTimeout(() => {
                that.setData({ make: false,isHide: false,isBtn: false,noSliding: false });
            }, 380);
        },
        noSliding () {},
        // --------------------设备升级 start--------------------------
        selectFunc (e) { // 选中车辆
            let index = e.currentTarget.dataset.index;
            if (this.data.carList[index].obuCardType !== 2) {
                this.setData({selectedIndex: -1,isBtn: false});
                return;
            }
            this.setData({selectedIndex: index,isBtn: true});
        },
        async queryCar () { // 选择其他车辆升级
            const result = await util.getDataFromServersV2('consumer/order/order-detail-for-update', {
                orderId: this.data.argObj.orderId
            },'post',false);

            let list = app.globalData.myEtcList.filter(item => item.obuStatus === 1 || item.obuStatus === 5);
            this.setData({
                isHide: true,
                carList: list
            });
        },
        async handle () { // 办理套餐
            console.log('办理套餐');
            // 判断是否是 权益券额套餐模式 ，如果是再判断以前是否有过办理，如果有则弹窗提示，并且不执行后面流程
            if (this.data.listOfPackages[this.data.choiceIndex].pledgeType === 4 && this.data.shopProductId) {
                if (await this.handlEquityLimit()) {
                    return;
                }
            }
            util.go(`/pages/device_upgrade/fill_in_information/fill_in_information?orderId=${this.data.carList[this.data.selectedIndex]?.id || this.data.argObj.orderId}`);
        },
        ok () { // 确认车牌号
            if (!this.data.isBtn) {
                util.showToastNoIcon('此车牌暂不支持设备升级');
                return;
            }
            if (this.data.isHide && this.data.isBtn) { // 确认车牌号
                // if (util.timeComparison('2023/05/01 00:00:00', this.data.carList[this.data.selectedIndex].addTime) === 1) {
                //     util.showToastNoIcon('提示该车牌已经是最新设备，无需重新办理');
                //     return;
                // }
                let carList = new Array(this.data.carList[this.data.selectedIndex]);
                this.setData({
                    carList,
                    isHide: false
                });
            }
        },
        // ---------------------end------------------------------------
        // 根据订单ID查询订单信息
        async queryOrder (orderId) {
            const result = await util.getDataFromServersV2('consumer/order/order-detail-for-update', {
                orderId: orderId
            },'post',false);
            if (!result) return;
            if (result.code === 0) {
                let carList = [{vehPlates: result.data.orderInfo.vehPlates,mobilePhone: result.data.orderReceive.receivePhone}];
                this.setData({carList});
            } else {
                util.showToastNoIcon(result.message);
            }
        },
        // 根据套餐id获取套餐信息
        async getProduct () {
            const result = await util.getDataFromServersV2('consumer/system/get-product-by-id', {
                shopProductId: this.data.shopProductId
            });
            if (!result) return;
            if (result.code === 0) {
                try {
                    result.data.descriptionList = JSON.parse(result.data.description);
                } catch (e) {
                }
                this.setData({
                    shopProductInfo: result.data
                });
            } else {
                util.showToastNoIcon(result.message);
            }
        },
        // 提交订单
        async emptySaveOrder () {
            let that = this;
            if (!that.data.isLoaded) {
                util.showToastNoIcon('数据加载中,请稍后重试');
                return;
            }
            if (that.data.isRequest) {
                return;
            } else {
                that.setData({isRequest: true});
            }
            wx.uma.trackEvent('package_the_rights_and_interests_next');
            that.setData({isRequest: false});
            let params = {
                mobilePhone: app.globalData.mobilePhone,	// 手机号码
                shopId: this.data.listOfPackages[this.data.choiceIndex].shopId, // 商户id
                dataType: '3', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
                dataComplete: 0, // 订单资料是否已完善 1-是，0-否
                shopProductId: this.data.listOfPackages[this.data.choiceIndex].shopProductId,	// 套餐ID
                rightsPackageId: this.data.listOfPackages[this.data.choiceIndex].rightsPackageIds ? this.data.listOfPackages[this.data.choiceIndex].rightsPackageIds[0] || '' : '',	// 权益包ID
                areaCode: '0',	// 区域编码
                related_order_id: this.data.related_order_id,	// 原订单ID
                orderId: this.data.orderId
            };
            const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
            that.setData({isRequest: false});
            if (!result) return;
            if (result.code === 0) {
                this.setData({orderId: result.data.orderId});
                app.globalData.orderInfo['orderId'] = result.data.orderId;
                // 添加协议记录
                const res = await util.getDataFromServersV2('consumer/order/after-sale-record/addProtocolRecord', {
                    orderId: result.data.orderId // 订单id
                });
                if (!res) return;
                // // 判断是否是 权益券额套餐模式 ，如果是再判断以前是否有过办理（ > 5个），如果有则弹窗提示，并且不执行后面流程
                if (this.data.listOfPackages[this.data.choiceIndex].pledgeType === 4) {
                    if (await this.handlEquityLimit()) {
                        return;
                    }
                }
                if (that.data.listOfPackages[that.data.choiceIndex]?.pledgePrice ||
                    that.data.equityListMap[that.data.activeIndex]?.payMoney) {
                    await that.marginPayment(that.data.listOfPackages[that.data.choiceIndex].pledgeType);
                }
            } else {
                util.showToastNoIcon(result.message);
            }
        },
        // 支付
        async marginPayment (pledgeType) {
            if (this.data.isRequest) return;
            this.setData({isRequest: true});
            util.showLoading();
            let params = {};
            if (pledgeType === 4) {
                // 押金模式
                params = {
                    payVersion: 'v3',
                    tradeType: 1,
                    orderId: app.globalData.orderInfo.orderId,
                    openid: app.globalData.openId
                };
            } else {
                // 普通模式
                params = {
                    orderId: app.globalData.orderInfo.orderId
                };
            }
            const result = await util.getDataFromServersV2('consumer/order/pledge-pay', params);
            if (!result) {
                this.setData({isRequest: false});
                return;
            }
            if (result.code === 0) {
                let extraData = result.data.extraData;
                wx.requestPayment({
                    nonceStr: extraData.nonceStr,
                    package: extraData.package,
                    paySign: extraData.paySign,
                    signType: extraData.signType,
                    timeStamp: extraData.timeStamp,
                    success: (res) => {
                        this.setData({isRequest: false});
                        if (res.errMsg === 'requestPayment:ok') {
                            util.go(`/pages/empty_hair/empty_qrcode/empty_qrcode`);
                        } else {
                            util.showToastNoIcon('支付失败！');
                        }
                    },
                    fail: (res) => {
                        this.setData({isRequest: false});
                        if (res.errMsg !== 'requestPayment:fail cancel') {
                            util.showToastNoIcon('支付失败！');
                        }
                    }
                });
            } else {
                this.setData({isRequest: false});
                util.showToastNoIcon(result.message);
            }
        },
        // 办理权益套餐的限制
        async handlEquityLimit () {
            const result = await util.getDataFromServersV2('consumer/order/precharge/list',{
                orderId: app.globalData.orderInfo.orderId // 订单id
            });
            if (!result) return;
            if (result.code === 0) {
                if (result.data.length >= 5) {
                    util.alert({
                        title: `提示`,
                        content: `该套餐目前暂只支持单人办理五台车辆`,
                        confirmColor: '#576B95',
                        cancelColor: '#000000',
                        cancelText: '我知道了',
                        confirm: () => {
                        },
                        cancel: async () => {
                        }
                    });
                    return true;
                } else {
                    return false;
                }
            } else {
                util.showToastNoIcon(result.message);
                return true;
            }
        }

    }
});
