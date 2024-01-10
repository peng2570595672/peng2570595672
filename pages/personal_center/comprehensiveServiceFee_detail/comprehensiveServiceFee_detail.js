const util = require('../../../utils/util.js');
const app = getApp();
Page({
  data: {
    invoiceTypes: [{
        name: '个人开票'
      },
      {
        name: '公司开票'
      }
    ],
    currentTab: 0,
    available: false, // 按钮是否可点击
    isRequest: false, // 是否请求中
    disabled: false,
    origin: 0, // 0 开票 1.查看详情
    invoiceType: 1, // 开票主体类型 1个人 2企业 必填
    invoiceInfo: {},
    routePrams: null // 区分开票的类型
  },
  async onLoad (options) {
    this.data.origin = parseInt(options.origin);
    let invoiceInfo = options.infoStr ? JSON.parse(options.infoStr) : {};
    if (this.data.origin === 0) {
      invoiceInfo.userPhone = app.globalData.mobilePhone;
      invoiceInfo.invoiceType = 1;
    } else {
      const index = invoiceInfo.invoiceType === 2 ? 0 : 1;
      this.data.invoiceTypes.splice(index, 1);
    }
    this.setData({
      invoiceTypes: this.data.invoiceTypes,
      origin: this.data.origin,
      invoiceInfo: invoiceInfo,
      disabled: this.data.origin === 1,
      currentTab: invoiceInfo.invoiceType === 2 ? 1 : 0
    });
    // 查询是否欠款
    await util.getIsArrearage();
  },
  onShow () {

  },
  // tab切换逻辑
  switchInvoiceType (e) {
    if (this.data.currentTab === e.target.dataset.current) {
      return false;
    } else {
      this.data.invoiceInfo.invoiceType = e.target.dataset.current + 1;
      this.setData({
        currentTab: e.target.dataset.current
      });
    }
    this.setData({
      available: !!this.validateAvailable()
    });
  },
  // 输入框输入值
  onInputChangedHandle (e) {
    let key = e.currentTarget.dataset.key;
    let invoiceInfo = this.data.invoiceInfo;
    invoiceInfo[key] = e.detail.value;
    this.setData({
      invoiceInfo
    });
    this.setData({
      available: this.validateAvailable()
    });
  },
  validateAvailable () {
    let invoiceInfo = this.data.invoiceInfo;
    let isOk = true;
    // 检验手机号码
    isOk = isOk && invoiceInfo.userPhone && /^1[0-9]{10}$/.test(invoiceInfo.userPhone);
    isOk = isOk && invoiceInfo.customerName && invoiceInfo.customerName.length >= 1;
    if (invoiceInfo.invoiceType === 2) {
      isOk = isOk && invoiceInfo.taxNo && invoiceInfo.taxNo.length >= 1;
      isOk = isOk && invoiceInfo.addrees && invoiceInfo.addrees.length >= 1;
      isOk = isOk && invoiceInfo.addreesTel && invoiceInfo.addreesTel.length >= 1;
      isOk = isOk && invoiceInfo.bank && invoiceInfo.bank.length >= 1;
      isOk = isOk && invoiceInfo.account && invoiceInfo.account.length >= 1;
    }
    return isOk;
  },
  onClickCommit () {
    if (!this.data.available || this.data.isRequest) {
      return;
    }
    let invoiceInfo = this.data.invoiceInfo;
    if (invoiceInfo.userEmail && !/^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,5}$/.test(invoiceInfo.userEmail)) {
      util.showToastNoIcon('邮箱格式不正确！');
      return false;
    }
    if (invoiceInfo.invoiceType === 2 && !/^[A-Z0-9]{15}$|^[A-Z0-9]{18}$|^[A-Z0-9]{20}$/.test(invoiceInfo.taxNo)) {
      util.showToastNoIcon('税号格式不正确！');
      return false;
    }
    this.saveInfo();
  },
  saveInfo () {
    wx.uma.trackEvent('personal_center_for_make_invoice_to_confirm');
    this.setData({
      isRequest: true
    });
    util.showLoading();
    // 判断需要调用开票的类型 和接口

    let paramsUrl = 'consumer/order/after-sale-record/apply-service-fee-invoice'; // 综合费开票接口

    util.getDataFromServer(paramsUrl, {
      ...this.data.invoiceInfo,
      payMoney: this.data.invoiceInfo.sumPoundage

    }, () => {
      util.showToastNoIcon('保存失败！');
    }, (res) => {
      if (res.code === 0) {
        wx.redirectTo({
          url: '/pages/personal_center/success_tips/success_tips'
        });
      } else {
        this.setData({
          isRequest: false
        });
        util.showToastNoIcon(res.message);
      }
    }, app.globalData.userInfo.accessToken, () => {
      util.hideLoading();
      this.setData({
        isRequest: false
      });
    });
  }
});
