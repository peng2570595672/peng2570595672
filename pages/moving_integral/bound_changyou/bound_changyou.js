// pages/moving_integral/bound_changyou/bound_changyou.js
import {
  mobilePhoneReplace
} from '../../../utils/util';
const util = require('../../../utils/util');
const app = getApp();
Page({
  data: {
    phone_number: mobilePhoneReplace(app.globalData.userInfo.mobilePhone), // 电话号码 隐藏号码的中间四位
    moving_integral: '_', // 移动积分
    chang_you_integral: 0, // 畅游积分
    mask: false, // 控制遮慕层的显示隐藏
    authorizePop: false, // 控制授权说明弹窗的显示隐藏
    verification_code: false, // 控制验证码弹窗的显示隐藏
    checkBindStatus: app.globalData.tonDunObj.checkBindStatus, // 畅游是否绑定
    queryScores: null, // 用户积分信息
    queryBindCode: null, // 获取绑定验证码信息
    prepareOrder: null, // 预下单信息
    arr1: {
      text1: '1. 本活动为移动积分兑换通行券活动，由合作伙伴上海分互链信息技术有限公司通过数据接口实时读取您在中国移动的消费积分的剩余数量，以完成兑换畅由积分后再兑换相应的ETC+通行券。',
      text2: '2. 积分兑换比例为：120移动积分=100畅由积分；180移动积分=1元通行券，具体可兑换面值以页面可选为准。',
      text3: '3. 一旦您确认使用移动积分兑换，指定的移动积分将自动消耗并转换为对应的畅由积分，默认您已接受积分不可回退事实，如您不接受该情况，请勿操作兑换。',
      text4: '4. 畅由积分成功兑换通行券后，不支持退货，如您不接受该情况，请勿操作兑换。',
      text5: '5. 通行券有效期为自领取之日起30天内有效，逾期自动作废且不可补发。通行券仅限ETC+办理用户用于通行高速时抵扣ETC通行费，不支持其他渠道ETC及其他通行扣费使用。'
    },
    vcValue: '', // 验证码弹窗输入的值
    time: 60,
    getCode: '获取验证码',
    timeFlag: false, // 控制验证时间的
    // 通行券的列表
    couponsConfigureArr: [
	{
      price: 2,
      movingIntegral: 360,
      changYouIntegral: 300,
      productCode: 'GZLL10042',
      couponConfigId: '1009103738631102464',
      batchId: '202208161417595704'
    },
    {
      price: 4,
      movingIntegral: 720,
      changYouIntegral: 600,
      productCode: 'GZLL10043',
      couponConfigId: '1009408396188721152',
      batchId: '202208171028354950'
    },
    {
      price: 6,
      movingIntegral: 1080,
      changYouIntegral: 900,
      productCode: 'GZLL10044',
      couponConfigId: '1009105498342957056',
      batchId: '202208161424593245'
    },
    {
      price: 10,
      movingIntegral: 1800,
      changYouIntegral: 1500,
      productCode: 'GZLL10045',
      couponConfigId: '1009106240629907456',
      batchId: '202208161427563345'
    },
    {
      price: 16,
      movingIntegral: 2880,
      changYouIntegral: 2400,
      productCode: 'GZLL10046',
      couponConfigId: '1009107183123570688',
      batchId: '202208161431407191'
    },
    {
      price: 20,
      movingIntegral: 3600,
      changYouIntegral: 3000,
      productCode: 'GZLL10047',
      couponConfigId: '1009114584463712256',
      batchId: '202208161501050363'
    }
    ]
  },

  onLoad (options) {
    let that = this;
	if (app.globalData.tonDunObj.checkBindStatus) {
		that.changYouIntegral();
	} else {
		util.showToastNoIcon('暂未绑定畅游,请先绑定畅游');
	}
  },
  // 查询积分
  async changYouIntegral () {
    let that = this;
    const res4 = await util.getDataFromServersV2('consumer/member/changyou/queryScores', {
      fingerprint: app.globalData.tonDunObj.fingerprint,
      sessionId: app.globalData.tonDunObj.sessionId,
      myOrderId: app.globalData.tonDunObj.myOrderId
    });
    that.setData({
      queryScores: res4.data
    });
    console.log('查询积分');
    console.log(res4);
    if (res4.data.cmcc.msg === '号码所在归属省暂未开通此业务，敬请期待！') {
      util.showToastNoIcon('号码归属省暂不支持兑换');
    };
  },

  // 点击 弹出模态框的 继续 按键
  ruleDescription (e) {
    let that = this;
    if (e.currentTarget.id === 'rule') {
      that.setData({
        authorizePop: true,
        mask: true
      });
    } else {
      this.setData({
        authorizePop: false,
        mask: false
      });
    }
  },

  // 获取验证码 验证等待的时间
  async btnVerificationCode () {
    let that = this;
    that.setData({
      timeFlag: true,
      getCode: '重新获取'
    });
    // 定时
    let timeClose = setInterval(function () {
      let num = --that.data.time;
      if (num < 0) {
        clearInterval(timeClose);
        return that.setData({
          timeFlag: false,
          time: 60
        });
      }
      that.setData({
        time: num
      });
    }, 1000);
    // 获取绑定验证码
    const res5 = await util.getDataFromServersV2('consumer/member/changyou/queryBindCode', {
      myOrderId: app.globalData.tonDunObj.myOrderId
    });
    that.setData({
      queryBindCode: res5.data
    });
    console.log('获取绑定验证码');
    console.log(res5);
  },

  // 验证码的输入获取
  input_change () {
    let that = this;
    // 验证码输入第六位后触发
    if (that.data.vcValue.length === 6) {
      this.bindChangYou(that.data.vcValue);
    }
  },

  // 绑定畅游
  async bindChangYou (vcValue) {
    let that = this;
    // 绑定畅游
    const res6 = await util.getDataFromServersV2('consumer/member/changyou/bindChangYou', {
      validateToken: that.data.queryBindCode.validateToken,
      myOrderId: app.globalData.tonDunObj.myOrderId,
      token: that.data.queryBindCode.token,
      type: that.data.queryBindCode.type,
      smscode: vcValue
    });
    console.log('绑定畅游');
    console.log(res6);
    if (res6.data) {
      app.globalData.tonDunObj.checkBindStatus = true;
      util.showToastNoIcon('已绑定畅游');
      that.setData({
        mask: false,
        checkBindStatus: true,
        timeFlag: false
      });
      that.changYouIntegral(); // 查询积分
    } else {
      app.globalData.tonDunObj.checkBindStatus = false;
      util.showToastNoIcon('验证失败');
      setTimeout(function () {
        util.go('/pages/Home/Home');
      }, 1000);
    }
    setTimeout(() => {
      that.setData({
        vcValue: ''
      });
    }, 1000);
  },

  // 点击立即兑换
  async confirm_exchange (e) {
    let that = this;
    const index = e.currentTarget.dataset.index;
    // 预下单
    const res7 = await util.getDataFromServersV2('consumer/member/changyou/prepareOrder', {
      myOrderId: app.globalData.tonDunObj.myOrderId,
      couponConfigId: that.data.couponsConfigureArr[index].couponConfigId,
      actualPrice: that.data.couponsConfigureArr[index].changYouIntegral,
      goodsList: [{
        goodsNo: that.data.couponsConfigureArr[index].productCode,
        goodsNum: 1
      }]
    });
    console.log('预下单');
    console.log(res7);

		// 判断畅游积分是否大于商品畅游积分
		app.globalData.tonDunObj.integralHighlight = parseInt(that.data.queryScores.points) >= parseInt(that.data.couponsConfigureArr[index].changYouIntegral);
    app.globalData.tonDunObj.orderId = res7.data.orderId;
    app.globalData.tonDunObj.index = index;
    app.globalData.tonDunObj.price = that.data.couponsConfigureArr[index].price;
    app.globalData.tonDunObj.changYouIntegral = that.data.couponsConfigureArr[index].changYouIntegral;
    util.go('/pages/moving_integral/confirm_exchange/confirm_exchange');
  },
  onUnload () {
    util.go('/pages/Home/Home');
  }
});
