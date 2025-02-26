const util = require('../../../utils/util');
const app = getApp();
Page({
    data: {
        chargingList: [
            {
                img: 'https://file.cyzl.com/g001/M01/DE/73/oYYBAGRkPZOAVd4PAAAF1TtTYVc445.png',
                describe1: '支持多种代扣方式'
            },
            {
                img: 'https://file.cyzl.com/g001/M01/DE/73/oYYBAGRkPaeAbOsHAAAFnVu1FkA446.png',
                describe1: '支持先通行后付费'
            },
            {
                img: 'https://file.cyzl.com/g001/M01/DE/73/oYYBAGRkPbqAK26AAAAFPhae2e4337.png',
                describe1: '支持一键补缴'
            }
        ],
        carOwnerList: [
            {
                img: 'https://file.cyzl.com/g001/M01/DE/76/oYYBAGRkQaCAU-qDAAAFApJ4awA929.png',
                describe1: '账单提醒'
            },
            {
                img: 'https://file.cyzl.com/g001/M01/DE/76/oYYBAGRkQbmAaYVCAAAFJJfGOks743.png',
                describe1: '发票开具'
            },
            {
                img: 'https://file.cyzl.com/g001/M01/DE/76/oYYBAGRkQcuAM5RYAAAFNA9lQT0169.png',
                describe1: '专人服务'
            },
            {
                img: 'https://file.cyzl.com/g001/M01/DE/76/oYYBAGRkQdyAe4Z-AAAFXqFGa7Q582.png',
                describe1: '权益商城'
            }
        ],
        serviceList: [
            {
                img: 'https://file.cyzl.com/g001/M01/DE/79/oYYBAGRkRYOALniHAAAJYBY9X4g367.png',
                describe1: '2年质保'
            },
            {
                img: 'https://file.cyzl.com/g001/M01/DE/7A/oYYBAGRkRZ2AUXb_AAAKQBTue84687.png',
                describe1: '设备检测'
            },
            {
                img: 'https://file.cyzl.com/g001/M01/DE/7A/oYYBAGRkRbaAAqFIAAAKtkIIizY648.png',
                describe1: '设备换修'
            },
            {
                img: 'https://file.cyzl.com/g001/M01/DE/7A/oYYBAGRkRcaAYYrnAAAKCYcle6U747.png',
                describe1: '注销服务'
            }
        ],
        bgColor: 'rgba(167, 200, 248, 1)',
        minShenBank: false, // 是否有中信银行联名套餐的订单
        transactScheduleData: undefined,	// 中信银行信用卡申请进度查询结果
        keepHandle: 0	//	控制底部悬浮按钮的文案展示
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad (options) {

    },

    async onShow () {
        // 查询是否欠款
        if (app.globalData.userInfo.accessToken) {
            await util.getIsArrearage();
            this.viewCiticBankList();
        } else {
            this.login();
        }
    },
    // 自动登录
    login () {
        // util.showLoading();
        // 调用微信接口获取code
        wx.login({
            success: async (res) => {
                const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
                    platformId: app.globalData.platformId, // 平台id
                    code: res.code // 从微信获取的code
                },'POST',false);
                if (!result) return;
                if (result.code) {
                    util.showToastNoIcon(result.message);
                    return;
                }
                result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
                this.setData({
                    loginInfo: result.data
                });
                // 已经绑定了手机号
                if (result.data.needBindingPhone !== 1) {
                    app.globalData.userInfo = result.data;
                    app.globalData.openId = result.data.openId;
                    app.globalData.memberId = result.data.memberId;
                    app.globalData.mobilePhone = result.data.mobilePhone;
                    // 查询是否欠款
                    await util.getIsArrearage();
                    this.viewCiticBankList();
                } else {
                    wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
                }
            },
            fail: () => {
                util.hideLoading();
                util.showToastNoIcon('登录失败！');
            }
        });
    },

    // 获取中信银行订单
    async viewCiticBankList () {
        let flag = [];
        if (app.globalData.myEtcList.length > 0) {
            flag = app.globalData.myEtcList.filter(item => app.globalData.cictBankObj.minshenBank === item.shopProductId);
            this.setData({viewCiticBankList: flag});
        }
        this.setData({keepHandle: flag.length,minShenBank: flag.length});
    },

    async citicBankProgress () {
        console.log(this.data.viewCiticBankList[0]);

        let res = await util.getDataFromServersV2('consumer/order/apply/ms/bank-card', {
            orderId: this.data.viewCiticBankList[0].id
        });
        console.log('测试222',res);
        if (!res) return;
        if (res.code === 0) {
            // console.log(`pages/home/sc-ws/sc-ws?params=${'https://' + encodeURIComponent(res.data.applyUrl.slice(8))}`);
            wx.navigateToMiniProgram({
                appId: 'wx8212297b23aff0ff',
                path: `pages/home/sc-ws/sc-ws?params=${'https://' + encodeURIComponent(res.data.applyUrl.slice(8))}`,
                envVersion: 'release',
                success () {},
                fail () {
                    // 拉起小程序失败
                    util.showToastNoIcon('拉起小程序失败, 请重试！');
                }
            });
            // 跳转 h5
            // util.go(`/pages/web/web/web?url=${encodeURIComponent(res.data.applyUrl)}`);
        } else {
            util.showToastNoIcon(res.message);
        }
    },
    onClickHandle () {
        // 未登录
        if (!app.globalData.userInfo.accessToken) {
            util.go('/pages/login/login/login');
            return;
        }
        if (!this.data.keepHandle) {
            // 立即办理：没有中信订单， 跳转到填写基础信息页
            util.go('/pages/default/receiving_address/receiving_address');
        } else {
            app.globalData.orderInfo.orderId = this.data.viewCiticBankList[0].id;	// 最近的一单
            if (this.data.viewCiticBankList[0].pledgeStatus === 0) {	// 去支付
                util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests`);
            } else if (this.data.viewCiticBankList[0].status === 0 || !this.data.viewCiticBankList[0].isOwner || !this.data.viewCiticBankList[0].isVehicle) {	// 去完善资料
                util.go(`/pages/default/information_list/information_list`);
            } else if (this.data.viewCiticBankList[0]?.contractStatus !== 1) { // 去签约
                util.go(`/pages/bank_card/citic_bank_sign/citic_bank_sign`);
            } else {
                util.showToastNoIcon('订单已存在，该活动仅首次办理有效！');
            }
        }
    },
    // 分享
    onShareAppMessage () {
        return {
            title: 'ETC民生联名套餐，0元办理，包邮到家！',
            imageUrl: 'https://file.cyzl.com/g001/M02/23/74/oYYBAGV6WnuAPVJlAAGvJUktz58636.png',
            path: '/pages/bank_card/minshen_bank_card_details/minshen_bank_card_details'
        };
    }
});
