function strToHexCharCode(str) {
	if (str === "") return "";
	var hexCharCode = [];
	for (var i = 0; i < str.length; i++) {
		hexCharCode.push(str.charCodeAt(i).toString(16))
	}
	return hexCharCode.join("").toUpperCase()
}

function bccCheck(data) {
	var bcc = "";
	for (var a = 0; a < data.length / 2; a++) {
		bcc ^= parseInt(data.substring(2 * a, 2 * a + 2), 16)
	}
	if (bcc.length == 1) {
		bcc = "0" + bcc
	}
	return tenToHex(bcc, 2).toUpperCase()
}

function tenToHex(num, len, boo) {
	var hex = num.toString(16);
	var zero = "";
	for (var a = 0; a < len - hex.length; a++) {
		zero += "0"
	}
	var ret = "";
	if (boo) {
		if (hex.length % 2 == 0) {} else {
			hex = "0" + hex;
			zero = zero.substring(1)
		}
		ret = hex + zero
	} else if (!boo) {
		ret = zero + hex
	}
	return ret.toUpperCase()
}

function hexToString(str) {
	var trimedStr = str.trim();
	var rawStr = trimedStr.substr(0, 2).toLowerCase() === "0x" ? trimedStr.substr(2) : trimedStr;
	var len = rawStr.length;
	if (len % 2 !== 0) {
		alert("Illegal Format ASCII Code!");
		return ""
	}
	var curCharCode;
	var resultStr = [];
	for (var i = 0; i < len; i = i + 2) {
		curCharCode = parseInt(rawStr.substr(i, 2), 16);
		resultStr.push(String.fromCharCode(curCharCode))
	}
	return resultStr.join("").toUpperCase()
}

function encodeUtf8(text) {
	const code = encodeURIComponent(text);
	const bytes = [];
	for (var i = 0; i < code.length; i++) {
		const c = code.charAt(i);
		if (c === "%") {
			const hex = code.charAt(i + 1) + code.charAt(i + 2);
			const hexVal = parseInt(hex, 16);
			bytes.push(hexVal);
			i += 2
		} else bytes.push(c.charCodeAt(0))
	}
	return bytes
}

function hexToTen(sixteen) {
	var ten = parseInt(sixteen, 16);
	return ten
}

function str2utf8(str) {
	var code;
	var utf = "";
	for (var i = 0; i < str.length; i++) {
		code = str.charCodeAt(i);
		if (code < 128) {
			utf += str.charAt(i)
		} else if (code < 2048) {
			utf += String.fromCharCode(192 | code >> 6 & 31);
			utf += String.fromCharCode(128 | code >> 0 & 63)
		} else if (code < 65536) {
			utf += String.fromCharCode(224 | code >> 12 & 15);
			utf += String.fromCharCode(128 | code >> 6 & 63);
			utf += String.fromCharCode(128 | code >> 0 & 63)
		} else {
			throw "不是UCS-2字符集"
		}
	}
	return utf
}

function hexTobin(str) {
	str = str.toUpperCase();
	let hex_array = [{
		key: 0,
		val: "0000"
	}, {
		key: 1,
		val: "0001"
	}, {
		key: 2,
		val: "0010"
	}, {
		key: 3,
		val: "0011"
	}, {
		key: 4,
		val: "0100"
	}, {
		key: 5,
		val: "0101"
	}, {
		key: 6,
		val: "0110"
	}, {
		key: 7,
		val: "0111"
	}, {
		key: 8,
		val: "1000"
	}, {
		key: 9,
		val: "1001"
	}, {
		key: "A",
		val: "1010"
	}, {
		key: "B",
		val: "1011"
	}, {
		key: "C",
		val: "1100"
	}, {
		key: "D",
		val: "1101"
	}, {
		key: "E",
		val: "1110"
	}, {
		key: "F",
		val: "1111"
	}];
	let value = "";
	for (let i = 0; i < str.length; i++) {
		for (let j = 0; j < hex_array.length; j++) {
			if (str.charAt(i) == hex_array[j].key) {
				value = value.concat(hex_array[j].val);
				break
			}
		}
	}
	return value
}

function binTohex(str) {
	let hex_array = [{
		key: 0,
		val: "0000"
	}, {
		key: 1,
		val: "0001"
	}, {
		key: 2,
		val: "0010"
	}, {
		key: 3,
		val: "0011"
	}, {
		key: 4,
		val: "0100"
	}, {
		key: 5,
		val: "0101"
	}, {
		key: 6,
		val: "0110"
	}, {
		key: 7,
		val: "0111"
	}, {
		key: 8,
		val: "1000"
	}, {
		key: 9,
		val: "1001"
	}, {
		key: "a",
		val: "1010"
	}, {
		key: "b",
		val: "1011"
	}, {
		key: "c",
		val: "1100"
	}, {
		key: "d",
		val: "1101"
	}, {
		key: "e",
		val: "1110"
	}, {
		key: "f",
		val: "1111"
	}];
	let value = "";
	let list = [];
	if (str.length % 4 !== 0) {
		let a = "0000";
		let b = a.substring(0, 4 - str.length % 4);
		str = b.concat(str)
	}
	while (str.length > 4) {
		list.push(str.substring(0, 4));
		str = str.substring(4)
	}
	list.push(str);
	for (let i = 0; i < list.length; i++) {
		for (let j = 0; j < hex_array.length; j++) {
			if (list[i] == hex_array[j].val) {
				value = value.concat(hex_array[j].key);
				break
			}
		}
	}
	return value
}

function strToBuffer(cmd) {
	let buffer = new ArrayBuffer(cmd.length / 2);
	let dataView = new Uint8Array(buffer);
	for (var a = 0; a < cmd.length / 2; a++) {
		dataView[a] = "0x" + cmd.substring(2 * a, 2 * a + 2)
	}
	return buffer
}

function bufferTohex(buffer) {
	var hexArr = Array.prototype.map.call(new Uint8Array(buffer), function(bit) {
		return ("00" + bit.toString(16)).slice(-2)
	});
	return hexArr.join("")
}

function isEmpty(data) {
	if (data.length == 0 || data == null || data == "undefined") {
		return true
	}
	return false
}

function formatTime(date) {
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	var hour = date.getHours();
	var minute = date.getMinutes();
	var second = date.getSeconds();
	return [year, month, day].map(formatNumber).join("/") + " " + [hour, minute, second].map(formatNumber).join(":")
}

function formatNumber(n) {
	n = n.toString();
	return n[1] ? n : "0" + n
}

function formatTimeTwo(number, format) {
	var formateArr = ["Y", "M", "D", "h", "m", "s"];
	var returnArr = [];
	var date = new Date(number * 1e3);
	returnArr.push(date.getFullYear());
	returnArr.push(formatNumber(date.getMonth() + 1));
	returnArr.push(formatNumber(date.getDate()));
	returnArr.push(formatNumber(date.getHours()));
	returnArr.push(formatNumber(date.getMinutes()));
	returnArr.push(formatNumber(date.getSeconds()));
	for (var i in returnArr) {
		format = format.replace(formateArr[i], returnArr[i])
	}
	return format
}
module.exports = {
	encodeUtf8: encodeUtf8,
	tenToHex: tenToHex,
	hexToTen: hexToTen,
	bccCheck: bccCheck,
	hexToString: hexToString,
	strToHexCharCode: strToHexCharCode,
	str2utf8: str2utf8,
	hexTobin: hexTobin,
	binTohex: binTohex,
	isEmpty: isEmpty,
	strToBuffer: strToBuffer,
	bufferTohex: bufferTohex,
	formatTime: formatTime,
	formatTimeTwo: formatTimeTwo
};
