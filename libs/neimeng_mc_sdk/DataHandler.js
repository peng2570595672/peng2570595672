module['exports'] = { 'numberToHexString': numberToHexString, 'hexStringToBufferArray': hexStringToBufferArray, 'bufferArrayToHexString': bufferArrayToHexString, 'makeTLV': makeTLV, 'resolveTLV': resolveTLV }; function numberToHexString(_0x36c950, _0x463c7e, _0x38db95) { var _0x326560 = { 'nAVJY': 'toString', 'luxFD': 'length', 'IvAjE': function (_0xeea948, _0x50f42e) { return _0xeea948 < _0x50f42e; }, 'IDouP': function (_0x3a8b28, _0x32089b) { return _0x3a8b28 * _0x32089b; }, 'pfZvW': function (_0x5b4310, _0x548a37) { return _0x5b4310 + _0x548a37; }, 'iTPfm': function (_0x273ceb, _0x29bf38) { return _0x273ceb > _0x29bf38; }, 'sPIgC': function (_0xd2be40, _0x49b8e7) { return _0xd2be40 * _0x49b8e7; }, 'rbwSy': 'substring', 'pazAR': function (_0xcb545c, _0x318c71) { return _0xcb545c - _0x318c71; }, 'aipBP': function (_0x575dbe, _0x41a46e) { return _0x575dbe * _0x41a46e; }, 'SJExV': function (_0x431843, _0x4d6129) { return _0x431843 == _0x4d6129; }, 'jBMEv': function (_0x801f5d, _0xcca905) { return _0x801f5d >= _0xcca905; } }; let _0x2a6336 = _0x36c950[_0x326560['nAVJY']](0x10); for (let _0x2312d2 = _0x2a6336[_0x326560['luxFD']]; _0x326560['IvAjE'](_0x2312d2, _0x326560['IDouP'](_0x463c7e, 0x2)); _0x2312d2++) { _0x2a6336 = _0x326560['pfZvW']('0', _0x2a6336); } if (_0x326560['iTPfm'](_0x2a6336[_0x326560['luxFD']], _0x326560['sPIgC'](_0x463c7e, 0x2))) { _0x2a6336 = _0x2a6336[_0x326560['rbwSy']](_0x326560['pazAR'](_0x2a6336[_0x326560['luxFD']], _0x326560['aipBP'](_0x463c7e, 0x2))); } if (_0x326560['SJExV'](_0x38db95, ![])) { let _0x159de5 = ''; for (let _0x2312d2 = _0x326560['pazAR'](_0x2a6336[_0x326560['luxFD']], 0x2); _0x326560['jBMEv'](_0x2312d2, 0x0); _0x2312d2 -= 0x2) { _0x159de5 = _0x326560['pfZvW'](_0x159de5, _0x2a6336[_0x326560['rbwSy']](_0x2312d2, _0x326560['pfZvW'](_0x2312d2, 0x2))); } _0x2a6336 = _0x159de5; } return _0x2a6336; } function hexStringToBufferArray(_0x253ed0) { var _0x3dd8dd = { 'BYydz': function (_0xc54413, _0x445785, _0x14603b) { return _0xc54413(_0x445785, _0x14603b); }, 'EBLhN': 'match', 'xhabi': 'map', 'YKVHY': 'buffer' }; let _0x261f28 = new Uint8Array(_0x253ed0[_0x3dd8dd['EBLhN']](/[0-9a-f]{2}/gi)[_0x3dd8dd['xhabi']](function (_0xc2fd7d) { return _0x3dd8dd['BYydz'](parseInt, _0xc2fd7d, 0x10); })); return _0x261f28[_0x3dd8dd['YKVHY']]; } function bufferArrayToHexString(_0x19ffed) { var _0x4c0da9 = { 'ftQKo': 'join' }; let _0x4bf278 = Array['prototype']['map']['call'](new Uint8Array(_0x19ffed), _0x42eb15 => ('00' + _0x42eb15['toString'](0x10))['slice'](-0x2))[_0x4c0da9['ftQKo']](''); return _0x4bf278; } function makeTLV(_0x205e14) { var _0x42bff2 = { 'hvujX': function (_0x30cc17, _0x19e926) { return _0x30cc17 < _0x19e926; }, 'bslpN': 'length', 'gQurR': function (_0x558b12, _0x58cd36) { return _0x558b12 + _0x58cd36; }, 'wlswF': function (_0x38e480, _0x4fcb1a) { return _0x38e480 + _0x4fcb1a; }, 'plINQ': function (_0x2e0795, _0x41c170, _0x24fd6d, _0x104745) { return _0x2e0795(_0x41c170, _0x24fd6d, _0x104745); }, 'ojbsf': function (_0x749588, _0x323908) { return _0x749588 + _0x323908; }, 'Swyge': function (_0x172f75, _0x5bc945) { return _0x172f75(_0x5bc945); }, 'CiBMc': function (_0x181190, _0x387c52) { return _0x181190 / _0x387c52; }, 'BBXdm': 'toString', 'vgkOt': function (_0x31d539, _0x1ba476) { return _0x31d539 != _0x1ba476; }, 'hUDOb': function (_0xb31836, _0x548630) { return _0xb31836 % _0x548630; }, 'THVdj': function (_0x206eb9, _0x2eae32) { return _0x206eb9 > _0x2eae32; }, 'jOGVy': function (_0x4f8a14, _0x568529) { return _0x4f8a14 / _0x568529; }, 'hKSJG': function (_0x274e39, _0x1d25b1) { return _0x274e39 + _0x1d25b1; } }; let _0x1974a9 = ''; for (let _0x53a2ae = 0x0; _0x42bff2['hvujX'](_0x53a2ae, _0x205e14[_0x42bff2['bslpN']]); _0x53a2ae++) { let _0x487484 = _0x42bff2['gQurR']('', _0x205e14[_0x53a2ae]); _0x1974a9 = _0x42bff2['gQurR'](_0x42bff2['wlswF'](_0x42bff2['wlswF'](_0x1974a9, _0x42bff2['plINQ'](numberToHexString, _0x42bff2['ojbsf'](_0x53a2ae, 0x1), 0x1, !![])), _0x42bff2['plINQ'](numberToHexString, _0x42bff2['Swyge'](parseInt, _0x42bff2['CiBMc'](_0x487484[_0x42bff2['bslpN']], 0x2)), 0x1, !![])), _0x487484); } let _0x27905a = _0x42bff2['CiBMc'](_0x1974a9[_0x42bff2['bslpN']], 0x2); let _0x3680da = _0x27905a[_0x42bff2['BBXdm']](0x10); if (_0x42bff2['vgkOt'](_0x42bff2['hUDOb'](_0x3680da[_0x42bff2['bslpN']], 0x2), 0x0)) { _0x3680da = _0x42bff2['ojbsf']('0', _0x3680da); } if (_0x42bff2['THVdj'](_0x27905a, 0x80)) { _0x3680da = _0x42bff2['ojbsf'](_0x42bff2['ojbsf'](0x80, _0x42bff2['Swyge'](parseInt, _0x42bff2['jOGVy'](_0x3680da[_0x42bff2['bslpN']], 0x2)))[_0x42bff2['BBXdm']](0x10), _0x3680da); } return _0x42bff2['ojbsf'](_0x42bff2['hKSJG']('80', _0x3680da), _0x1974a9); } function resolveTLV(_0x5aa4e1) { var _0x55f7cc = { 'yhElI': function (_0x54d453, _0x22a7f3, _0x572cd9) { return _0x54d453(_0x22a7f3, _0x572cd9); }, 'xMQXk': 'substring', 'BnBiI': function (_0xdb9746, _0x31ac1b) { return _0xdb9746 > _0x31ac1b; }, 'HuMRA': function (_0x46906c, _0x54a723) { return _0x46906c + _0x54a723; }, 'nOjJz': function (_0x488040, _0x3d19de) { return _0x488040 * _0x3d19de; }, 'pLfIK': function (_0xb1743, _0x183acc) { return _0xb1743 - _0x183acc; }, 'osoUH': function (_0x919b40, _0x4b6cc9) { return _0x919b40 < _0x4b6cc9; }, 'WdpkI': 'length', 'WXXHq': function (_0x5ea9bc, _0x4d9844, _0x5d8ed2) { return _0x5ea9bc(_0x4d9844, _0x5d8ed2); }, 'cbQEJ': function (_0x2ed5f9, _0x1ab8b0) { return _0x2ed5f9 + _0x1ab8b0; }, 'DGKJH': function (_0x3dea9d, _0x5c99f4) { return _0x3dea9d * _0x5c99f4; }, 'zqypg': 'push' }; let _0x13e45e = new Array(); let _0xfa0ba1 = _0x55f7cc['yhElI'](parseInt, _0x5aa4e1[_0x55f7cc['xMQXk']](0x2, 0x4), 0x10); let _0x55ea3d = 0x4; if (_0x55f7cc['BnBiI'](_0xfa0ba1, 0x80)) { _0x55ea3d = _0x55f7cc['HuMRA'](_0x55ea3d, _0x55f7cc['nOjJz'](_0x55f7cc['pLfIK'](_0xfa0ba1, 0x80), 0x2)); } let _0x3afacd = 0x1; while (_0x55f7cc['osoUH'](_0x55ea3d, _0x5aa4e1[_0x55f7cc['WdpkI']])) { let _0x423abf = _0x55f7cc['yhElI'](parseInt, _0x5aa4e1[_0x55f7cc['xMQXk']](_0x55ea3d, _0x55f7cc['HuMRA'](_0x55ea3d, 0x2)), 0x10); _0x55ea3d += 0x2; let _0x236445 = _0x55f7cc['WXXHq'](parseInt, _0x5aa4e1[_0x55f7cc['xMQXk']](_0x55ea3d, _0x55f7cc['cbQEJ'](_0x55ea3d, 0x2)), 0x10); _0x55ea3d += 0x2; let _0x1bdfc9 = _0x5aa4e1[_0x55f7cc['xMQXk']](_0x55ea3d, _0x55f7cc['cbQEJ'](_0x55ea3d, _0x55f7cc['DGKJH'](_0x236445, 0x2))); _0x13e45e[_0x55f7cc['zqypg']](_0x1bdfc9); _0x55ea3d += _0x55f7cc['DGKJH'](_0x236445, 0x2); } return _0x13e45e; }