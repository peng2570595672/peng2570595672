// pages/customer_service/index/index.js
Page({

    data: {

    },

    onLoad (options) {

    },

    onShow () {

    },
    getQueryCallback (e) {
        console.log(e);
    },
    // 点击机器人回答里的链接跳转 webview,需要开发者自己配置一个承载 webview 的页面,url 字段对应的小程序页面需要开发者自己创建开发者需要在小程序后台配置相应的域
    openWebview (e) {
        let url = e.detail.weburl;
        util.go(`/pages/web/web/web?url=${url}`);
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
                success (res) {
                    // 打开成功
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
    }
});
