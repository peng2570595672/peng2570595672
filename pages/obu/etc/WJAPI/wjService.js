'use strict'; var _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function (e) { return typeof e; } : function (e) { return e && typeof Symbol === 'function' && e.constructor === Symbol && e !== Symbol.prototype ? 'symbol' : typeof e; }; var _wjUtils = require('./wjUtils.js'); var _wjUtils2 = _interopRequireDefault(_wjUtils); function _interopRequireDefault (e) { return e && e.__esModule ? e : {default: e}; } var connectedDeviceId; var timeID; var onDisconnect; var ListenFlag = void 0; var DataListenerCallBack = void 0; var foundDevices = []; var TAG_FUNCTION = 'function'; var services = '0000FEE7-0000-1000-8000-00805F9B34FB'; var notifyServiceId = '0000FEC8-0000-1000-8000-00805F9B34FB'; var writeServiceId = '0000FEC7-0000-1000-8000-00805F9B34FB'; function reallyscanConnect (s,r) { var d = {}; _wjUtils2.default.showLog('/***********Runing :: Do reallyConnect() begin *************/'),foundDevices = [],wx.closeBluetoothAdapter(),wx.openBluetoothAdapter({success: function (e) { wx.startBluetoothDevicesDiscovery({services: [],success: function (e) { wx.onBluetoothDeviceFound(function (e) { for (var i = 0; i < e.devices.length; i++) { for (var n = !1,c = 0; c < foundDevices.length; c++) if (e.devices[i].deviceId == foundDevices[c].deviceId) { n = !0; break; } var t = e.devices[i].name; if (_wjUtils2.default.showLog('connectedDeviceName',e.devices[i].name),n == 0 && t != '' && t != null && (foundDevices.push(e.devices[i]),t.indexOf('WJ') != -1 || t.indexOf('WanJi') != -1)) { connectedDeviceId = e.devices[i].deviceId; var o = {}; o.name = t,o.deviceId = connectedDeviceId,_wjUtils2.default.showLog('connectedDeviceId',e.devices),wx.stopBluetoothDevicesDiscovery({success: function (e) { _wjUtils2.default.showLog('停止扫描，开始连接'),timeID != null && (clearTimeout(timeID),timeID = null),reallyConnect(o,function (e) { (void 0 === s ? 'undefined' : _typeof(s)) == TAG_FUNCTION && s(e); },function (e) { (void 0 === r ? 'undefined' : _typeof(r)) == TAG_FUNCTION && r(e); }); },fail: function (e) { _wjUtils2.default.showError('stopBluetoothDevicesDiscovery:' + e),d.serviceCode = 1003,d.serviceInfo = 'stopBluetoothDevicesDiscovery fail!',(void 0 === s ? 'undefined' : _typeof(s)) == TAG_FUNCTION && s(d); }}); break; } } }); },fail: function (e) { _wjUtils2.default.showError('scanerror:' + e),d.serviceCode = 1002,d.serviceInfo = 'scanerror fail!',(void 0 === s ? 'undefined' : _typeof(s)) == TAG_FUNCTION && s(d); }}),timeID = setTimeout(function () { wx.closeBluetoothAdapter(),_wjUtils2.default.showError('scan timeout'),d.serviceCode = 100100,d.serviceInfo = 'scan timeout fail!',(void 0 === s ? 'undefined' : _typeof(s)) == TAG_FUNCTION && s(d); },5e3); },fail: function (e) { _wjUtils2.default.showError('openadapter:' + e),d.serviceCode = 1001,d.serviceInfo = 'openadapter fail!',(void 0 === s ? 'undefined' : _typeof(s)) == TAG_FUNCTION && s(d); }}); } function reallyConnect (e,i,n) { _wjUtils2.default.showLog('start reallyConnect，20190830001，V0.0.4'),_onBLEConnectionStateChange(),onDisconnect = n; var c = {}; var t = e.name; _wjUtils2.default.showLog('name:',t),t.indexOf('WJ') != -1 || t.indexOf('WanJi') != -1 || t.indexOf('ZZ') != -1 ? (connectedDeviceId = e.deviceId,wx.createBLEConnection({deviceId: connectedDeviceId,success: function (e) { _wjUtils2.default.showLog('已连接,开始使能服务',connectedDeviceId),_enableService(function (e) { e.serviceCode == 0 ? (_wjUtils2.default.showLog('已连接,并使能成功'),c.serviceCode = 0,c.serviceInfo = 'connected',(void 0 === i ? 'undefined' : _typeof(i)) == TAG_FUNCTION && i(c),(void 0 === onDisconnect ? 'undefined' : _typeof(onDisconnect)) == TAG_FUNCTION && onDisconnect(c)) : ((c = e).serviceInfo = '连接成功，但服务使能失败!',(void 0 === i ? 'undefined' : _typeof(i)) == TAG_FUNCTION && i(c)); }),timeID = setTimeout(function () { wx.closeBLEConnection({deviceId: connectedDeviceId,success: function (e) {}}),wx.closeBluetoothAdapter(),_wjUtils2.default.showError('scan timeout'),c.serviceCode = 100100,c.serviceInfo = 'scan timeout fail!',(void 0 === i ? 'undefined' : _typeof(i)) == TAG_FUNCTION && i(c); },5e3); },fail: function (e) { _wjUtils2.default.showError('creatcon error:' + e),c.serviceCode = 1005,c.serviceInfo = 'creatcon error fail!',(void 0 === i ? 'undefined' : _typeof(i)) == TAG_FUNCTION && i(c); }})) : (c.serviceCode = 1004,c.serviceInfo = "device's name error",(void 0 === i ? 'undefined' : _typeof(i)) == TAG_FUNCTION && i(c)); } function _enableService (t) { var o = {}; wx.getBLEDeviceServices({deviceId: connectedDeviceId,success: function (e) { for (var i = 0; i < e.services.length; i++) { var n = e.services[i].uuid; n == services && wx.getBLEDeviceCharacteristics({deviceId: connectedDeviceId,serviceId: n,success: function (e) { for (var i = 0,n = 0; n < e.characteristics.length; n++) { var c = e.characteristics[n].uuid; c == notifyServiceId ? i++ : c == writeServiceId && i++; }i < 2 ? (o.serviceCode = -1,o.serviceInfo = 'getBLEDeviceCharacteristics temp<2!',(void 0 === t ? 'undefined' : _typeof(t)) == TAG_FUNCTION && t(o)) : wx.notifyBLECharacteristicValueChange({deviceId: connectedDeviceId,serviceId: services,characteristicId: notifyServiceId,state: !0,success: function (e) { _onBLECharacteristicValueChange(),timeID != null && (clearTimeout(timeID),timeID = null),o.serviceCode = 0,o.serviceInfo = 'enable success!',(void 0 === t ? 'undefined' : _typeof(t)) == TAG_FUNCTION && t(o); },fail: function () { o.serviceCode = 1008,o.serviceInfo = 'notifyBLECharacteristicValueChange fail!',(void 0 === t ? 'undefined' : _typeof(t)) == TAG_FUNCTION && t(o); }}); },fail: function () { o.serviceCode = 1007,o.serviceInfo = 'getBLEDeviceCharacteristics fail!',(void 0 === t ? 'undefined' : _typeof(t)) == TAG_FUNCTION && t(o); }}); } },fail: function () { o.serviceCode = 1006,o.serviceInfo = 'getBLEDeviceServices fail!',(void 0 === t ? 'undefined' : _typeof(t)) == TAG_FUNCTION && t(o); }}); } function _onBLEConnectionStateChange () { var i = {}; wx.onBLEConnectionStateChange(function (e) { console.error('device ' + e.deviceId + ' state has changed, connected: ' + e.connected),e.connected == 0 && (wx.closeBLEConnection({deviceId: connectedDeviceId,success: function (e) {}}),wx.closeBluetoothAdapter(),i.serviceCode = 1,i.serviceInfo = 'disconnected',(void 0 === onDisconnect ? 'undefined' : _typeof(onDisconnect)) == TAG_FUNCTION && onDisconnect(i)); }); } function reallyDisConnect (i) { var n = {}; wx.closeBLEConnection({deviceId: connectedDeviceId,success: function (e) { _wjUtils2.default.showLog('closeBLEConnection:',e); }}),wx.closeBluetoothAdapter({success: function (e) { _wjUtils2.default.showLog('closeBluetoothAdapter',e),n.serviceCode = 0,n.serviceInfo = '断开蓝牙成功!',(void 0 === i ? 'undefined' : _typeof(i)) == TAG_FUNCTION && i(n); }}); } function _writeBLECharacteristicValue (e,i) { var n = {}; wx.writeBLECharacteristicValue({deviceId: connectedDeviceId,serviceId: services,characteristicId: writeServiceId,value: e,success: function (e) { _wjUtils2.default.showLog('writeBLECharacteristicValue success',e.errMsg),n.serviceCode = 0,n.serviceInfo = e.errMsg,(void 0 === i ? 'undefined' : _typeof(i)) == TAG_FUNCTION && i(n); }}); } function _onBLECharacteristicValueChange () { wx.onBLECharacteristicValueChange(function (e) { _wjUtils2.default.showLog('有回复'),ListenFlag == 1 && (void 0 === DataListenerCallBack ? 'undefined' : _typeof(DataListenerCallBack)) == TAG_FUNCTION && DataListenerCallBack(e.value); }); } function _SetDataListenerCallBack (e,i) { e == 1 ? (ListenFlag = !0,DataListenerCallBack = i) : e == 0 && (ListenFlag = !1); }module.exports = {reallyscanConnect: reallyscanConnect,reallyDisConnect: reallyDisConnect,reallyConnect: reallyConnect,_writeBLECharacteristicValue: _writeBLECharacteristicValue,_SetDataListenerCallBack: _SetDataListenerCallBack};
