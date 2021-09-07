var dataTool = require("./dataTool");
var config = require("./JLZJConfig");
var onfire = require("./onfire");
export function receiveReset(callBack) {
	onfire.on(config.ResetFlag(), res => {
		onfire.clear();
		var data = unpack33Protocol(res, 1);
		var result = config.DevResult(1, data);
		callBack.call(this, result)
	})
};
export function receiveChannel(callBack) {
	onfire.on(config.ChannelFlag(), res => {
		onfire.clear();
		var data = unpack33Protocol(res, 0);
		var result = config.DevResult(0, data);
		callBack.call(this, result)
	})
};

function unpack33Protocol(data, type) {
	var result_str = "";
	for (var i = 0; i < data.length; i++) {
		var sub_data = data[i];
		var data_33 = unpackWechatProtocol(sub_data);
		var resultData = {
			code: "",
			msg: "",
			data: ""
		};
		var tempBean_33 = {
			ST: "",
			SN: "",
			CTL: "",
			LEN: "",
			DATA: "",
			BCC: ""
		};
		tempBean_33.ST = data_33.substring(0 * 2, 1 * 2);
		tempBean_33.SN = data_33.substring(1 * 2, 2 * 2);
		tempBean_33.CTL = data_33.substring(2 * 2, 3 * 2);
		tempBean_33.LEN = data_33.substring(3 * 2, 4 * 2);
		tempBean_33.DATA = data_33.substring(4 * 2, data_33.length - 2);
		tempBean_33.BCC = data_33.substring(data_33.length - 2);
		var bcc = dataTool.tenToHex(dataTool.bccCheck(tempBean_33.SN + tempBean_33.CTL + tempBean_33.LEN + tempBean_33.DATA),
			2);
		if (tempBean_33.BCC === bcc) {
			resultData = unCmd(i, tempBean_33.DATA, type);
			result_str = result_str + resultData.data
		} else {
			resultData.code = config.errorCode();
			resultData.msg = "BCC校验失败";
			resultData.data = ""
		}
	}
	resultData.data = result_str;
	return resultData
}

function unCmd(count, data_cmd, type) {
	var resultData = {
		code: 0,
		msg: "",
		data: ""
	};
	if (count == 0) {
		var statu = data_cmd.substring(1 * 2, 2 * 2);
		if (statu === "00") {
			resultData.code = config.successCode();
			resultData.msg = "执行成功";
			if (type == 0) {
				var sub_data = data_cmd.substr(10, data_cmd.length);
				resultData.data = unApduData(sub_data)[0]
			} else {
				resultData.data = data_cmd
			}
		} else if (statu === "CF") {
			resultData.code = config.cardNoExists();
			resultData.msg = "执行失败,请插入卡片";
			resultData.data = ""
		} else {
			resultData.code = config.errorCode();
			resultData.msg = "执行失败，状态是" + statu;
			resultData.data = ""
		}
		return resultData
	} else {
		resultData.code = 0;
		resultData.data = data_cmd;
		resultData.msg = "执行成功";
		return resultData
	}
}

function unApduData(data) {
	var flag = data.substring(0 * 2, 1 * 2);
	var apdus = [];
	var len = 0;
	if (flag === "81") {
		len = dataTool.hexToTen(data.substring(1 * 2, 2 * 2));
		var temp = data.substring(2 * 2);
		var i = 0;
		do {
			var len1 = dataTool.hexToTen(temp.substring(1 * 2, 2 * 2)) + 2;
			apdus.push(temp.substring(2 * 2, len1 * 2));
			i = i + len1;
			if (i < len) {
				temp = temp.substring(len1 * 2)
			}
		} while (i < len)
	} else if (flag === "82") {
		len = dataTool.hexToTen(apduStr.substring(1 * 2, 3 * 6));
		var temp = data.substring(3 * 6);
		var i = 0;
		do {
			var len1 = dataTool.hexToTen(temp.substring(1 * 2, 2 * 2)) + 2;
			apdus.push(temp.substring(2 * 2, len1 * 2));
			i = i + len1;
			if (i < len) {
				temp = temp.substring(len1 * 2)
			}
		} while (i < len)
	} else {
		len = dataTool.hexToTen(flag);
		var temp = data.substring(1 * 2);
		var i = 0;
		do {
			var len1 = dataTool.hexToTen(temp.substring(1 * 2, 2 * 2)) + 2;
			apdus.push(temp.substring(2 * 2, len1 * 2));
			i = i + len1;
			if (i < len) {
				temp = temp.substring(len1 * 2)
			}
		} while (i < len)
	}
	return apdus
}

function unpackWechatProtocol(data) {
	var tempBean_wx = {
		wxMagicNumber: "",
		wxVer: "",
		wxLen: "",
		wxCMD: "",
		wxSeq: "",
		wxData: "",
		wxExtra: "",
		wxTail: "",
		wxTotalData: ""
	};
	tempBean_wx.wxMagicNumber = data.substring(0 * 2, 1 * 2);
	tempBean_wx.wxVer = data.substring(1 * 2, 2 * 2);
	tempBean_wx.wxLen = data.substring(2 * 2, 4 * 2);
	tempBean_wx.wxCMD = data.substring(4 * 2, 6 * 2);
	tempBean_wx.wxSeq = data.substring(6 * 2, 8 * 2);
	tempBean_wx.wxExtra = data.substring(8 * 2, 11 * 2);
	var len = dataTool.hexToTen(data.substring(11 * 2, 12 * 2));
	if ((len & 128) == 128) {
		var len1 = len & 127;
		var len2 = dataTool.hexToTen(data.substring(12 * 2, 13 * 2)) & 127;
		var len3 = (len2 << 7) + len1;
		tempBean_wx.wxData = data.substring(13 * 2, len3 * 2 + 26)
	} else {
		tempBean_wx.wxData = data.substring(12 * 2, len * 2 + 24)
	}
	return tempBean_wx.wxData
}

function getwcDATAlen(dataLen) {
	var len = "";
	var lens1 = 0;
	var lens2 = 0;
	if (dataLen > 127) {
		lens1 = dataLen & 127 | 128;
		lens2 = dataLen >> 7 & 127;
		len = dataTool.tenToHex(lens1, 2) + dataTool.tenToHex(lens2, 2)
	} else {
		len = dataTool.tenToHex(dataLen, 2)
	}
	return len
}
