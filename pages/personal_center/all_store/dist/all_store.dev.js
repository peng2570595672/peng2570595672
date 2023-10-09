"use strict";

// pages/personal_center/all_store/all_store.js
Page({
  data: {
    region: ['贵州省', '遵义市', '习水县']
  },
  onLoad: function onLoad(options) {},
  onShow: function onShow() {},
  // 打电话
  phone: function phone(e) {
    wx.makePhoneCall({
      phoneNumber: e.currentTarget.dataset.phone
    });
  },
  bindRegionChange: function bindRegionChange(e) {
    console.log(e);
    var regionInfo = e.detail;
    this.setData({
      region: regionInfo.value
    });
  }
});