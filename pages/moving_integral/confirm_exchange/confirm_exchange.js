// pages/moving_integral/confirm_exchange/confirm_exchange.js
import {
  mobilePhoneReplace
} from '../../../utils/util';
const util = require('../../../utils/util');
const app = getApp();
Page({
  data: {
    phone_number: mobilePhoneReplace(app.globalData.userInfo.mobilePhone), // 电话号码 隐藏号码的中间四位
    popFlag: false, // 控制验证码弹窗
    mobileCode: '', // 畅游积分可以直接兑换的验证码
    orderId: '', // 预下单信息
    queryScoreCode: null, // 获取兑换积分验证码返回的信息
    integralHighlight: false, // 确定谁的积分高亮
    optCode: '', // 验证码
    vcValue: '', // 下单前验证码
    exchangeScore: null, // 兑换畅游积分返回的信息
    makeOrder: null, // 下单返回的信息
    confirmBtn: false, // 控制确认按钮是下单还是兑换积分
    iphoneModel: false, // 控制iPad类型的样式
    price: null, // 商品价格
    changYouIntegral: null, // 畅游积分
    time: 60, // 定时时间
    timeFlag: false,
    getCode: '获取',
    flag: false // 判断有没有获取验证码
  },

  onLoad (options) {
    let that = this;
    wx.getSystemInfo({
      success (res) {
        if (res.model.includes('iPad')) {
          that.setData({
            iphoneModel: true
          });
        }
      }
    });
    that.setData({
      integralHighlight: app.globalData.tonDunObj.integralHighlight,
      orderId: app.globalData.tonDunObj.orderId,
      price: app.globalData.tonDunObj.price,
      changYouIntegral: app.globalData.tonDunObj.changYouIntegral
    });
  },

  // 获取兑换积分验证码
  async getChangYouCode () {
    let that = this;
    that.setData({
      optCode: '',
      timeFlag: true,
      flag: true,
      getCode: '已获取'
    });
    // 定时
    let timeClose = setInterval(function () {
      let num = --that.data.time;
      if (num < 0) {
        clearInterval(timeClose);
        return that.setData({
          timeFlag: false,
          time: 60,
          getCode: '获取'
        });
      }
      that.setData({
        time: num
      });
    }, 1000);
    const res = await util.getDataFromServersV2('consumer/member/changyou/queryScoreCode', {
      myOrderId: app.globalData.tonDunObj.myOrderId,
      outerPoints: parseInt(app.globalData.tonDunObj.changYouIntegral) * 1.2, // 移动积分
      orderId: that.data.orderId
    });
    that.setData({
      queryScoreCode: res.data
    });
    if (res.code === '104' || res.code === 104) {
      util.showToastNoIcon('获取验证码失败');
    }
    console.log('获取兑换积分验证码');
    console.log(res);
  },

  // 畅游积分可直接 兑换的输入获取
  input_change (e) {
    let that = this;
    if (e.detail.value.length === 4) {
      that.utilOverBooking(e.detail.value);
    }
  },
  // 当畅游积分不足输入验证码
  inputCode2 (e) {
    let that = this;
    if (e.detail.value.length === 6) {
      that.setData({
        confirmBtn: true
      });
    } else {
      that.setData({
        confirmBtn: false
      });
    }
  },

  // 点击兑换畅游积分和下单
  confirmExchange () {
    let that = this;
    if (that.data.confirmBtn && !that.data.integralHighlight) {
      that.redeemPoints();
    } else {
      that.overBooking();
    }
  },
  // 按钮置灰时 触发
  invalidBtn () {
    util.showToastNoIcon('请输入6位短信验证码');
  },

  // 兑换积分
  async redeemPoints () {
    let that = this;
    if (!that.data.flag) {
      return util.showToastNoIcon('请先获取验证码');
    }
    // 兑换畅游积分
    const res1 = await util.getDataFromServersV2('consumer/member/changyou/exchangeScore', {
      myOrderId: app.globalData.tonDunObj.myOrderId,
      outerOrderId: that.data.queryScoreCode.outerOrderId,
      orderId: that.data.orderId,
      sessionId: app.globalData.tonDunObj.sessionId,
      optCode: that.data.optCode
    });
    console.log('兑换畅游积分');
    console.log(res1);
    that.setData({
      exchangeScore: res1.data
    });
    if (res1.data.code !== null) {
      that.setData({
        optCode: ''
      });
      return util.showToastNoIcon('验证码错误');
    }
    that.setData({
      integralHighlight: true,
      flag: false
    });
    app.globalData.tonDunObj.integralHighlight = true;
    util.showToastNoIcon('畅由积分兑换成功');
  },

  // 下单
  async overBooking () {
    let that = this;
    if (that.data.confirmBtn) {
      // 畅游兑换过积分
      that.setData({
        mobileCode: ''
      });
      // 下单
      const res2 = await util.getDataFromServersV2('consumer/member/changyou/makeOrder', {
        myOrderId: app.globalData.tonDunObj.myOrderId,
        orderId: that.data.orderId,
        sessionId: app.globalData.tonDunObj.sessionId
      });
      that.setData({
        makeOrder: res2.data
      });
      console.log('下单');
      console.log(res2);
      if (res2.data.code == null) {
        util.go(
          `/pages/moving_integral/exchange_success/exchange_success?price=${app.globalData.tonDunObj.price}`
        );
      } else {
        util.go('/pages/moving_integral/exchange_fail/exchange_fail');
      }
    } else {
      // 畅游没有兑换过积分  必须 获取下单验证码
      const res3 = await util.getDataFromServersV2('consumer/member/changyou/queryOrderCode', {
        myOrderId: app.globalData.tonDunObj.myOrderId,
        orderId: that.data.orderId
      });
      console.log('畅游没有兑换过积分必须获取下单验证码');
      console.log(res3);
      if (res.code === '104' || res.code === 104) {
        util.showToastNoIcon('获取验证码失败');
      }
      that.setData({
        popFlag: true
      });
    }
  },

  // 下单-畅游积分足够不需要兑换 直接跳转
  async utilOverBooking (mobileCode) {
    let that = this;
    that.setData({
      popFlag: false
    });
    // 下单
    const res2 = await util.getDataFromServersV2('consumer/member/changyou/makeOrder', {
      myOrderId: app.globalData.tonDunObj.myOrderId,
      orderId: that.data.orderId,
      sessionId: app.globalData.tonDunObj.sessionId,
      mobileCode: mobileCode
    });
    that.setData({
      makeOrder: res2.data
    });
    console.log('下单');
    console.log(res2.data);
    if (res2.data.code == null) {
      util.go(`/pages/moving_integral/exchange_success/exchange_success?price=${app.globalData.tonDunObj.price}`);
    } else {
      util.go('/pages/moving_integral/exchange_fail/exchange_fail');
    }
  },

  onUnload () {
    app.globalData.tonDunObj.pages = 2;
  }

});
