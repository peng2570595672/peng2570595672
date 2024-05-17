
const util = require('../../../utils/util.js');
const app = getApp();
Page({
    data: {
        carNoStr: '', // 车牌字符串
        carNo: ['', '', '', '', '', '', '', ''], // 车牌对应的数组
        showKeyboard: false, // 是否显示键盘
        currentIndex: -1, // 当前选中的输入车牌位置
        available: false,
        getAgreement: false,// 是否接受协议
        nmOrderList: [],
        chooseOrderList: [] // 传入的订单列表
    },
    async onLoad (options) {
        console.log(app.globalData.chooseOrderList);
        if (app.globalData.chooseOrderList) {
            this.setData({
                // 重新选中的一条订单
                chooseOrderList: app.globalData.chooseOrderList
            });
        }
        await this.IsAnActivationOrder();
    },
    onReady () {

    },
    onShow () {

    },
    onHide () {

    },
    onUnload () {

    },
    // 点击添加新能源
    onClickNewPowerCarHandle (e) {
        this.setData({
            isNewPowerCar: true
        });
        this.setCurrentCarNo(e);
    },

    // 是否接受协议   点击同意协议并且跳转指定套餐模块
    onClickAgreementHandle () {
        let getAgreement = !this.data.getAgreement;
        this.setData({
            getAgreement
        });
    },
    validateCar () {
        if (!this.data.available) {
            return;
        }
        // 判断是否存在未完成的换牌申请
        this.getAMontonkaOrder('',this.data.carNoStr);
    },
    // 是否存在多个已激活订单
    async IsAnActivationOrder () {
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/getNmgActOrder', {
        });
        if (!result) return;
        if (result.code === 0 && result.data) {
            this.setData({
                // 保存已激活订单 至少有一条
                nmOrderList: result.data
            });
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    setOtherCarNo () {
        // 历史办理页
        let url = 'optionalOldLicensePlateList';
        util.go(`/pages/default/${url}/${url}`);
    },
    // 校验字段是否满足
    validateAvailable (checkLicensePlate) {
        // 是否接受协议
        let isOk = true;
        // 验证车牌和车牌颜色
        if (this.data.carNoStr.length === 7) { // 蓝牌或者黄牌
            // 进行正则匹配
            if (isOk) {
                let creg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
                isOk = creg.test(this.data.carNoStr);
                if (checkLicensePlate && !isOk) {
                    util.showToastNoIcon('车牌输入不合法，请检查重填');
                }
            }
        } else if (this.data.carNoStr.length === 8) {
            // 进行正则匹配
            if (isOk) {
                let xreg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{6}$/;
                isOk = xreg.test(this.data.carNoStr);
                if (checkLicensePlate && !isOk) {
                    util.showToastNoIcon('车牌输入不合法，请检查重填');
                }
            }
        } else {
            isOk = false;
        }
        return isOk;
    },
    //  校验新车牌是否可办理
    async getAMontonkaOrder (oldVehPlates, newVehPlates) {
        // 参数：不传检验是否有未完成的换牌申请，
        // oldVehPlates-旧车牌，传了校验是否该车牌有欠费，
        // newVehPlates-传了校验新车牌是否可用
        let params = {};
        if (oldVehPlates) {
            params.oldVehPlates = oldVehPlates;
        }
        if (newVehPlates) {
            params.newVehPlates = newVehPlates;
        }
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/verify', params);
        if (!result) return;
        if (result.code === 0) {
            // 查询并判断是否多个已经激活的蒙通卡
            if (result.data.verify) {
                // 不存在 历史订单
                console.log('不存在历史订单');
                app.globalData.orderInfo.orderId = this.data.chooseOrderList[0]?.orderId || this.data.nmOrderList[0]?.orderId;
                util.go(`/pages/default/information_validation/information_validation?vehPlates=${this.data.carNoStr}&vehColor=${this.data.chooseOrderList[0]?.vehColor || this.data.nmOrderList[0]?.vehColor}&obuCardType=2&applyOrder=true`);
            } else {
                // 有历史订单 中断办理
                this.selectComponent('#popTipComp').show({
                    type: 'shenfenyanzhifail',
                    title: '提示',
                    btnCancel: '好的',
                    refundStatus: true,
                    content: result.message,
                    bgColor: 'rgba(0,0,0, 0.6)'
                });
            }
        } else {
            this.selectComponent('#popTipComp').show({
                type: 'shenfenyanzhifail',
                title: '提示',
                btnCancel: '好的',
                refundStatus: true,
                content: result.message,
                bgColor: 'rgba(0,0,0, 0.6)'
            });
        }
    },
    // 车牌输入回调
    valueChange (e) {
        // 兼容处理
        if (app.globalData.SDKVersion < '2.6.1') {
            let keyboard = this.selectComponent('#keyboard');
            keyboard.indexMethod(e.detail.index, this.data.currentIndex);
        }
        // 设置数据
        this.setData({
            carNo: e.detail.carNo, // 车牌号数组
            carNoStr: e.detail.carNo.join(''), // 车牌号字符串
            currentIndex: e.detail.index, // 当前输入车牌号位置
            showKeyboard: e.detail.show // 是否显示键盘
        });
        // 不是新能源 输入车牌最后一位隐藏键盘
        if (!this.data.isNewPowerCar && this.data.currentIndex === 7) {
            this.setData({
                showKeyboard: false,
                currentIndex: -1
            });
        }
        // 兼容处理是否显示或者隐藏键盘
        if (app.globalData.SDKVersion < '2.6.1') {
            let keyboard = this.selectComponent('#keyboard');
            keyboard.showMethod(this.data.showKeyboard);
        }
        // 键盘关闭
        if (!this.data.showKeyboard) {
            let checkLicensePlate = false;
            if (e.detail.carNo.join('').length >= 7) {
                checkLicensePlate = true;
            }
            this.setData({
                currentIndex: -1,
                vehColor: '0'
            });
            this.setData({
                available: this.validateAvailable(checkLicensePlate)
            });
        }
    },
    // 点击某一位输入车牌
    setCurrentCarNo (e) {
        let index = e.currentTarget.dataset['index'];
        index = parseInt(index);
        if (app.globalData.SDKVersion < '2.6.1') {
            let keyboard = this.selectComponent('#keyboard');
            keyboard.indexMethod(index, this.data.currentIndex);
        }
        this.setData({
            currentIndex: index,
            showKeyboard_new: false,
            showKeyboard: true
        });
        if (app.globalData.SDKVersion < '2.6.1') {
            let keyboard = this.selectComponent('#keyboard');
            keyboard.showMethod(this.data.showKeyboard);
        }
    },
    // 显示键盘时，点击其他区域关闭键盘
    touchHandle (e) {
        if (this.data.showKeyboard) {
            this.setData({
                showKeyboard: false
            });
            let keyboard = this.selectComponent('#keyboard');
            keyboard.showMethod(false);
            this.setData({
                available: this.validateAvailable()
            });
        }
    }
});
