const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {

    },

    onLoad (options) {
        let obj = ['办理与发货','安装/激活','高速过闸','黑名单','通行费','退货/退款'];
        // let pages = getCurrentPages();
        // let arr1 = pages[pages.length - 2].route.split('/');
        // let str1 = arr1[arr1.length - 1];
        // switch (str1) {
        //     case 'Home':
        //         obj = ['设备坏了'];
        //         break;
        //     case 'index':
        //         obj = ['怎么办理ETC'];
        //         break;
        //     case 'processing_progress':
        //         obj = ['怎么安装ETC'];
        //         break;
        //     case 'my_etc_detail':
        //         obj = ['ETC设备有那些'];
        //         break;
        //     default:
        //         break;
        // }
        this.customerServicePlugin(obj);
    },
    getQueryCallback (e) {
        // console.log(e);
    },
    // 点击机器人回答里的链接跳转 webview,需要开发者自己配置一个承载 webview 的页面,url 字段对应的小程序页面需要开发者自己创建开发者需要在小程序后台配置相应的域
    openWebview (e) {
        let url = e.detail.weburl;
        util.go(`/pages/web/web/web?url=${encodeURIComponent(url)}`);
    },
    // 点击机器人回答中的小程序，需要在开发者自己的小程序内做跳转开发者需要在小程序配置中指定跳转小程序的 appId
    openMiniProgram (e) {
        let {appid, pagepath} = e.detail;
        if (appid) {
            wx.navigateToMiniProgram({
                appId: appid,
                path: pagepath,
                extraData: {},
                envVersion: '',
                fail () {
                    util.showToastNoIcon('打开小程序失败, 请重试！');
                }
            });
        } else {
            wx.navigateTo({
                url: pagepath,
                fail () {
                    wx.switchTab({
                        url: pagepath
                    });
                }
            });
        }
    },
    /**
     * 在线客服 初始化
     * @param {*} obj 快捷输入信息列表
     */
    customerServicePlugin (obj) {
        console.log(obj);
        let plugin = requirePlugin('chatbot');
        plugin.init({
            appid: 'MEj2s7PeweWhuUp29wsxXt2PckKhFw', // 微信对话开放平台中应用绑定小程序插件appid
            openid: app.globalData.openId, // 小程序用户的openid，必填项
            userHeader: '', // 用户头像,不传会弹出登录框
            userName: '', // 用户昵称,不传会弹出登录框
            anonymous: false, // 是否允许匿名用户登录，版本1.2.9后生效, 默认为false，设为true时，未传递userName、userHeader两个字段时将弹出登录框
            success: (res) => { console.log(res); },// 非必填
            fail: (error) => { console.log(error); },// 非必填
            guideList: obj,
            textToSpeech: true, // 默认为ture打开状态
            background: 'rgba(247,251,252,0.5)',
            guideCardHeight: 50,
            // operateCardHeight: 145
            history: false,
            navHeight: 0,
            robotHeader: 'https://file.cyzl.com/g001/M01/B4/88/oYYBAGO7vKSATlbsAAAI0wRP5HM859.png',
            hideMovableButton: false
        });
    }
});
