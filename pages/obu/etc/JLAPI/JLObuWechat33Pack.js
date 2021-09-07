var dataTool = require("./dataTool");
var cmdKey = require("./JLZJConfig.js");
var wxSeq = 0;
var frame = 0;
var MAX_PACK_LEN = 95;
var ST = "33";
export function wechatInit1(mac) {
	var cmd_arr = packWechatInit1(mac);
	return cmd_arr
};
export function wechatInit2() {
	var cmd_arr = packWechatInit2();
	return cmd_arr
};
export function ICCResetReq() {
	var cmd = cmdKey.ICCResetCmd();
	var cmd_arr = packData(cmd);
	return cmd_arr
};
export function ESAMResetReq() {
	var cmd = cmdKey.ESAMResetCmd();
	var cmd_arr = packData(cmd);
	return cmd_arr
};
export function ICCChannelTransmission(type, dataArr) {
	var cmdApdu = cread_apdu(dataArr);
	var cmdApduLen = cmdApdu.length / 2;
	var cmd = cmdKey.ICCChannelCmd() + type + dataTool.tenToHex(cmdApduLen, 4, true) + cmdApdu;
	var cmd_arr = packData(cmd);
	return cmd_arr
};
export function ESAMChannelTransmission(type, dataArr) {
	var cmdApdu = cread_apdu(dataArr);
	var cmdApduLen = cmdApdu.length / 2;
	var cmd = cmdKey.ESAMChannelCmd() + type + dataTool.tenToHex(cmdApduLen, 4, true) + cmdApdu;
	var cmd_arr = packData(cmd);
	return cmd_arr
};

function packData(cmd) {
	var cmd_arr = pack33Protocol(cmd);
	var wechat_arr = packWechatCmd(cmd_arr);
	var cmdArray = [];
	for (var i = 0; i < wechat_arr.length; i++) {
		var wechat_cmd = wechat_arr[i].wxTotalData;
		if (wechat_cmd.length < 40) {
			cmdArray.push(wechat_cmd)
		} else {
			for (var j = 0; j < wechat_cmd.length; j += 40) {
				var wechat_sub_cmd = wechat_cmd.substr(j, 40);
				cmdArray.push(wechat_sub_cmd)
			}
		}
	}
	return cmdArray
}

function pack33Protocol(cmd) {
	add_Frame();
	var cmdlen = cmd.length / 2;
	var cmd33conten = [];
	if (cmdlen > MAX_PACK_LEN) {
		var packages = Math.round(cmdlen / MAX_PACK_LEN);
		for (var i = 0; i < packages; i++) {
			var tempBean = {
				ST: "",
				SN: "",
				CTL: "",
				LEN: "",
				DATA: "",
				BCC: "",
				TOTALDATA: ""
			};
			tempBean.ST = ST;
			tempBean.SN = dataTool.tenToHex(frame, 2);
			if (i == 0) {
				tempBean.CTL = get_ctl(1, packages - (i + 1))
			} else {
				tempBean.CTL = get_ctl(0, packages - (i + 1))
			}
			if (i + 1 == packages) {
				tempBean.DATA = cmd.substring(i * MAX_PACK_LEN * 2)
			} else {
				tempBean.DATA = cmd.substring(i * MAX_PACK_LEN * 2, i * MAX_PACK_LEN * 2 + MAX_PACK_LEN * 2)
			}
			tempBean.LEN = dataTool.tenToHex(tempBean.DATA.length / 2, 2);
			tempBean.BCC = dataTool.bccCheck(tempBean.SN + tempBean.CTL + tempBean.LEN + tempBean.DATA);
			console.log("tempBean.BCC====================:" + tempBean.BCC);
			tempBean.TOTALDATA = tempBean.ST + tempBean.SN + tempBean.CTL + tempBean.LEN + tempBean.DATA + tempBean.BCC;
			cmd33conten.push(tempBean)
		}
	} else {
		var tempBean = {
			ST: "",
			SN: "",
			CTL: "",
			LEN: "",
			DATA: "",
			BCC: "",
			TOTALDATA: ""
		};
		tempBean.ST = ST;
		tempBean.SN = dataTool.tenToHex(frame, 2);
		tempBean.CTL = get_ctl(1, 0);
		tempBean.LEN = dataTool.tenToHex(cmdlen, 2);
		tempBean.DATA = cmd;
		tempBean.BCC = dataTool.bccCheck(tempBean.SN + tempBean.CTL + tempBean.LEN + tempBean.DATA);
		tempBean.TOTALDATA = tempBean.ST + tempBean.SN + tempBean.CTL + tempBean.LEN + tempBean.DATA + tempBean.BCC;
		cmd33conten.push(tempBean)
	}
	return cmd33conten
}
export function cread_apdu(cmdArr) {
	var content = cread_TLV(cmdArr);
	var contentuLen = content.length / 2;
	var contentApdu = "";
	var contentApduLen = "";
	if (contentuLen <= 80) {
		contentApduLen = dataTool.tenToHex(contentuLen, 2)
	} else {
		if (contentuLen <= 255) {
			contentApduLen = "81" + dataTool.tenToHex(contentuLen, 2)
		} else {
			contentApduLen = "82" + dataTool.tenToHex(contentuLen, 4)
		}
	}
	contentApdu = "80" + contentApduLen + content;
	return contentApdu
};

function cread_TLV(cmdArr) {
	var strTLV = "";
	for (var i = 1; i <= cmdArr.length; i++) {
		var cmd = cmdArr[i - 1];
		var len = cmd.length / 2;
		strTLV = strTLV + dataTool.tenToHex(i, 2) + dataTool.tenToHex(len, 2) + cmd
	}
	return strTLV
}

function add_Frame() {
	frame++;
	if (frame > 15) {
		frame = 0
	}
}

function get_ctl(bit7, serial) {
	var ctl = "";
	if (bit7 == 0) {
		ctl = dataTool.tenToHex(serial, 2)
	} else {
		var n = (2 << 6) + serial;
		ctl = dataTool.tenToHex(n, 2)
	}
	return ctl
}
export function packWechatInit1(mac) {
	var cmd = "fe01000e4e21" + mac + "0a0208001200";
	var cmd_arr = [];
	for (var i = 0; i < cmd.length; i += 40) {
		var cmd_sub = cmd.substr(i, 40);
		cmd_arr.push(cmd_sub)
	}
	return cmd_arr
};
export function packWechatInit2() {
	var cmd = "fe0100134e23" + "0002" + "0a02080010b42418f8ac01";
	var cmd_arr = [];
	for (var i = 0; i < cmd.length; i += 40) {
		var cmd_sub = cmd.substr(i, 40);
		cmd_arr.push(cmd_sub)
	}
	return cmd_arr
};

function packWechatCmd(cmdArray) {
	var cmdwxconten = [];
	var temp33conten = cmdArray;
	if (temp33conten.length > 0) {
		for (var i = 0; i < temp33conten.length; i++) {
			var tempBean_33 = temp33conten[i].TOTALDATA;
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
			tempBean_wx.wxMagicNumber = "FE";
			tempBean_wx.wxVer = "01";
			tempBean_wx.wxLen = dataTool.tenToHex(tempBean_33.length / 2 + 14, 4);
			tempBean_wx.wxCMD = "7531";
			tempBean_wx.wxSeq = "0000";
			tempBean_wx.wxExtra = "0A0012" + getwcDATAlen(tempBean_33.length / 2);
			tempBean_wx.wxData = tempBean_33;
			tempBean_wx.wxTail = "1800";
			tempBean_wx.wxTotalData = tempBean_wx.wxMagicNumber + tempBean_wx.wxVer + tempBean_wx.wxLen + tempBean_wx.wxCMD +
				tempBean_wx.wxSeq + tempBean_wx.wxExtra + tempBean_wx.wxData + tempBean_wx.wxTail;
			cmdwxconten.push(tempBean_wx)
		}
	}
	return cmdwxconten
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
