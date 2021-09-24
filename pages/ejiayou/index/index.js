const util = require('../../../utils/util.js');
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    page:1,
    pageSize:10,
    list:[],
    total:0, //总条数
    latitude:26.67865,
    longitude:106.62298,
    navData:[{title:"距离优先",value:""},{title:"低价优先",value:"price"}],
    navData2:["92#","95#","98#","0#"],
    navData3:[{title:"全部",value:""},{title:"中石油",value:1},{title:"中石化",value:2},{title:"壳牌",value:3},{title:"其他",value:4}],
    isShow:false,
    isShowID:0,
    distance:"距离优先",
    oilCode:"92#",
    stationType:"",
    stationTypeName:"全部",
    orderByField:""  //price
  },
    /**
   * 生命周期函数--监听页面加载
   */
  onShow: function (options) {
    this.getLocation()
  },
  //显示table
  onShowTable(e){
    console.log(e)
    console.log(e.currentTarget.dataset.id)
    this.setData({
      isShow:true,
      isShowID:e.currentTarget.dataset.id
    })
  },
  //不显示table
  onHideTable(){
    this.setData({
      isShow:false
    })
  },
  onTableInde(e){
    console.log(e)
    let id=parseInt(e.currentTarget.dataset.id);
    this.setData({
      distance:id==0?e.currentTarget.dataset.name.title:this.data.distance,
      orderByField:id==0?e.currentTarget.dataset.name.value:this.data.orderByField,
      oilCode:id==1?e.currentTarget.dataset.name:this.data.oilCode,
      stationTypeName:id==2?e.currentTarget.dataset.name.title:this.data.stationTypeName,
      stationType:id==2?e.currentTarget.dataset.name.value:this.data.stationType,
      isShow:false,
      page:1,
    })
    this.onGetList()
  },
  onScrolltolower(e){
    if(this.data.list.length>=this.data.total) return;
    this.setData({
			page:  this.data.page + 1
    });
    console.log(e,"99999999999999999")
    this.onGetList()
  },
  async onGetList(){
    console.log( this.data.page,'==================')
   util.showLoading({title: '加载中'});
   let params={
    userLng:this.data.longitude,
    userLat:this.data.latitude,
    pageSize:this.data.pageSize,
    page:this.data.page,
    cityId:"",//城市编码
    oilCode:this.data.oilCode,//油号，例如:95#
    stationType:this.data.stationType,//油站品牌
    orderByField:this.data.orderByField//true就是价格
   }
    const result = await util.getDataFromServersV2('consumer/order/oil/stationsList', params);
    console.log(result)
    if(result.code!=0) return;
    let list = result.data.list || [];
        this.setData({
          list:this.data.list.concat(list),
          total:result.data.total
        })
  },
  //按地址查
  onSearch(e){
   console.log(e.detail.value)
  },
  onGetUrl(e){
  let url=e.target.dataset.url
    util.go(url)
  },
  //获取位置信息
  getLocation(){
    wx.getLocation({
      type: 'wgs84',
      success:(res)=>{
        console.log(res,'--------成功----------')
        const latitude = res.latitude
        const longitude = res.longitude
        const speed = res.speed
        const accuracy = res.accuracy
        this.setData({
          latitude,
          longitude
        })
        this.onGetList();
      },
      fail:(error)=>{
          console.log(error,'--------失败----------')
          this.showFail()
      }
     })
  },
  //当用户拒绝授权时，弹窗引导开启定位
  showFail(){
    wx.showModal({
      title:"使用加油服务需获取当前定位信息，请先开启位置授权",
      showCancel:false,
      confirmText:"设置",
      confirmColor:"#00B85C",
      success(){
         wx.openSetting({ //调起设置
          success (res) {
            console.log(res.authSetting)
          }
        })
      }
    })
  },
  //导航
  onNavigation(e){
      wx.openLocation({
        latitude:this.data.latitude,
        longitude:this.data.longitude,
        name:"位置名位置名",//位置名
        address:"地址的详细说明地址的详细说明",//地址的详细说明
        scale: 18
      })
  },
  async onWebView(e){
    let item=e.currentTarget.dataset.id;
    console.log(app.globalData.userInfo)
    let params={
      userLng:this.data.longitude,// 	是 	string 	用户坐在位置经度，百度坐标系
      userLat:this.data.latitude,// 	是 	string 	用户坐在位置纬度，百度坐标系
      userPhone:app.globalData.mobilePhone,// 	是 	string 	手机号
      stationId:item.stationId// 	是 	string 	油站号码
    }
    console.log(params,'-----------油站号码---------------')
    const result = await util.getDataFromServersV2('consumer/order/oil/getStationUrl', params);
    console.log(result)
    if(result.code==0){
      let url=encodeURIComponent(result.data.url)
      util.go(`/pages/ejiayou/webview/webview?url=${url}`)
    }
  }
})