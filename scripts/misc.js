var LINK_TAG_FONTAWESOME = '<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.3.1/css/all.css" integrity="sha384-mzrmE5qonljUremFsqc01SB46JvROS7bZs3IO2EmfFsd15uHvIt+Y8vEf7N7fWAU" crossorigin="anonymous">';

var BTN_TIME_RECORDING = '<div id="btn_timerecord_wrapper"><button class="btn btn-danger m-r-sm btn_timerecord"></button></div>';

var INIT_TIMERECORD_ALERT = '<div class="init_timerecord_alert"><span style="font-size:0.7em;font-weight:normal;">[Alert from SuperTurkers]</span><br>Click the button to record working time to start this HIT ($0.05 bonus)<br>'+BTN_TIME_RECORDING+'</div>';

function isAfterSubmitPage(url){
    if (window.location.href.includes("externalSubmit")) return true;
    else return false;
}

function isMTurkPage(url){
    return (isMTurkTopPage(url) || isMTurkParentPage(url) || isIFrame(url))
           && !isAfterSubmitPage(url);
}

function isMTurkTopPage(url){ //check if page is mTurk
    var re = /^https\:\/\/worker(sandbox)?\.mturk\.com\/?(\?.*)?$/;
    if(url.match(re)) return true;
    else return false;
}

function isMTurkParentPage(url){ //check if page is mTurk
    var re = /^https\:\/\/worker(sandbox)?\.mturk\.com\/projects\/.*/;
    if(url.match(re)) return true;
    else return false;
}

function isPreviewPage(url){
    var re = /^https\:\/\/worker(sandbox)?\.mturk\.com\/projects\/[A-Z0-9]+\/tasks(\/?|\?\S*)$/;
    if(url.match(re)) return true;
    else return false;
}

function isIFrame(url){
    var re = /hitId=.+/;
    if(url.match(re)) return true;
    else return false;
}

function removeLastExtraChar(url){
    if(url.endsWith("/") || url.endsWith("?") || url.endsWith("&")) return url.slice(0,-1);
    else return url;
}

/*
MD5
Copyright (C) 2007 MITSUNARI Shigeo at Cybozu Labs, Inc.
license:new BSD license
how to use
CybozuLabs.MD5.calc(<ascii string>);
CybozuLabs.MD5.calc(<unicode(UTF16) string>, CybozuLabs.MD5.BY_UTF16);

ex. CybozuLabs.MD5.calc("abc") == "900150983cd24fb0d6963f7d28e17f72";
*/
var CybozuLabs = {
    MD5 : {
        // for Firefox
        int2hex8_Fx : function(x) {
            return this.int2hex8((x[1] * 65536) + x[0]);
        },

        /* sprintf(buf, "%08x", i32); */
        int2hex8 : function(i32) {
            var i, c, ret = "";
            var hex = "0123456789abcdef";
            for (i = 0; i < 4; i++) {
                c = i32 >>> (i * 8);
                ret += hex.charAt((c >> 4) & 15);
                ret += hex.charAt(c & 15);
            }
            return ret;
        },

        update_std : function(buf, charSize) {
            var a = this.a_, b = this.b_, c = this.c_, d = this.d_;
            var tmp0, tmp1, tmp2, tmp3, tmp4, tmp5, tmp6, tmp7, tmp8, tmp9, tmpa, tmpb, tmpc, tmpd, tmpe, tmpf;
            if (charSize == 1) {
                tmp0 = buf.charCodeAt( 0) | (buf.charCodeAt( 1) << 8) | (buf.charCodeAt( 2) << 16) | (buf.charCodeAt( 3) << 24);
                tmp1 = buf.charCodeAt( 4) | (buf.charCodeAt( 5) << 8) | (buf.charCodeAt( 6) << 16) | (buf.charCodeAt( 7) << 24);
                tmp2 = buf.charCodeAt( 8) | (buf.charCodeAt( 9) << 8) | (buf.charCodeAt(10) << 16) | (buf.charCodeAt(11) << 24);
                tmp3 = buf.charCodeAt(12) | (buf.charCodeAt(13) << 8) | (buf.charCodeAt(14) << 16) | (buf.charCodeAt(15) << 24);
                tmp4 = buf.charCodeAt(16) | (buf.charCodeAt(17) << 8) | (buf.charCodeAt(18) << 16) | (buf.charCodeAt(19) << 24);
                tmp5 = buf.charCodeAt(20) | (buf.charCodeAt(21) << 8) | (buf.charCodeAt(22) << 16) | (buf.charCodeAt(23) << 24);
                tmp6 = buf.charCodeAt(24) | (buf.charCodeAt(25) << 8) | (buf.charCodeAt(26) << 16) | (buf.charCodeAt(27) << 24);
                tmp7 = buf.charCodeAt(28) | (buf.charCodeAt(29) << 8) | (buf.charCodeAt(30) << 16) | (buf.charCodeAt(31) << 24);
                tmp8 = buf.charCodeAt(32) | (buf.charCodeAt(33) << 8) | (buf.charCodeAt(34) << 16) | (buf.charCodeAt(35) << 24);
                tmp9 = buf.charCodeAt(36) | (buf.charCodeAt(37) << 8) | (buf.charCodeAt(38) << 16) | (buf.charCodeAt(39) << 24);
                tmpa = buf.charCodeAt(40) | (buf.charCodeAt(41) << 8) | (buf.charCodeAt(42) << 16) | (buf.charCodeAt(43) << 24);
                tmpb = buf.charCodeAt(44) | (buf.charCodeAt(45) << 8) | (buf.charCodeAt(46) << 16) | (buf.charCodeAt(47) << 24);
                tmpc = buf.charCodeAt(48) | (buf.charCodeAt(49) << 8) | (buf.charCodeAt(50) << 16) | (buf.charCodeAt(51) << 24);
                tmpd = buf.charCodeAt(52) | (buf.charCodeAt(53) << 8) | (buf.charCodeAt(54) << 16) | (buf.charCodeAt(55) << 24);
                tmpe = buf.charCodeAt(56) | (buf.charCodeAt(57) << 8) | (buf.charCodeAt(58) << 16) | (buf.charCodeAt(59) << 24);
                tmpf = buf.charCodeAt(60) | (buf.charCodeAt(61) << 8) | (buf.charCodeAt(62) << 16) | (buf.charCodeAt(63) << 24);
            } else {
                tmp0 = buf.charCodeAt( 0) | (buf.charCodeAt( 1) << 16);
                tmp1 = buf.charCodeAt( 2) | (buf.charCodeAt( 3) << 16);
                tmp2 = buf.charCodeAt( 4) | (buf.charCodeAt( 5) << 16);
                tmp3 = buf.charCodeAt( 6) | (buf.charCodeAt( 7) << 16);
                tmp4 = buf.charCodeAt( 8) | (buf.charCodeAt( 9) << 16);
                tmp5 = buf.charCodeAt(10) | (buf.charCodeAt(11) << 16);
                tmp6 = buf.charCodeAt(12) | (buf.charCodeAt(13) << 16);
                tmp7 = buf.charCodeAt(14) | (buf.charCodeAt(15) << 16);
                tmp8 = buf.charCodeAt(16) | (buf.charCodeAt(17) << 16);
                tmp9 = buf.charCodeAt(18) | (buf.charCodeAt(19) << 16);
                tmpa = buf.charCodeAt(20) | (buf.charCodeAt(21) << 16);
                tmpb = buf.charCodeAt(22) | (buf.charCodeAt(23) << 16);
                tmpc = buf.charCodeAt(24) | (buf.charCodeAt(25) << 16);
                tmpd = buf.charCodeAt(26) | (buf.charCodeAt(27) << 16);
                tmpe = buf.charCodeAt(28) | (buf.charCodeAt(29) << 16);
                tmpf = buf.charCodeAt(30) | (buf.charCodeAt(31) << 16);
            }

            a += tmp0 + 0xd76aa478 + ((b & c) | (~b & d)); a = b + ((a <<  7) | (a >>> 25));
            d += tmp1 + 0xe8c7b756 + ((a & b) | (~a & c)); d = a + ((d << 12) | (d >>> 20));
            c += tmp2 + 0x242070db + ((d & a) | (~d & b)); c = d + ((c << 17) | (c >>> 15));
            b += tmp3 + 0xc1bdceee + ((c & d) | (~c & a)); b = c + ((b << 22) | (b >>> 10));
            a += tmp4 + 0xf57c0faf + ((b & c) | (~b & d)); a = b + ((a <<  7) | (a >>> 25));
            d += tmp5 + 0x4787c62a + ((a & b) | (~a & c)); d = a + ((d << 12) | (d >>> 20));
            c += tmp6 + 0xa8304613 + ((d & a) | (~d & b)); c = d + ((c << 17) | (c >>> 15));
            b += tmp7 + 0xfd469501 + ((c & d) | (~c & a)); b = c + ((b << 22) | (b >>> 10));
            a += tmp8 + 0x698098d8 + ((b & c) | (~b & d)); a = b + ((a <<  7) | (a >>> 25));
            d += tmp9 + 0x8b44f7af + ((a & b) | (~a & c)); d = a + ((d << 12) | (d >>> 20));
            c += tmpa + 0xffff5bb1 + ((d & a) | (~d & b)); c = d + ((c << 17) | (c >>> 15));
            b += tmpb + 0x895cd7be + ((c & d) | (~c & a)); b = c + ((b << 22) | (b >>> 10));
            a += tmpc + 0x6b901122 + ((b & c) | (~b & d)); a = b + ((a <<  7) | (a >>> 25));
            d += tmpd + 0xfd987193 + ((a & b) | (~a & c)); d = a + ((d << 12) | (d >>> 20));
            c += tmpe + 0xa679438e + ((d & a) | (~d & b)); c = d + ((c << 17) | (c >>> 15));
            b += tmpf + 0x49b40821 + ((c & d) | (~c & a)); b = c + ((b << 22) | (b >>> 10));
            a += tmp1 + 0xf61e2562 + ((b & d) | (c & ~d)); a = b + ((a <<  5) | (a >>> 27));
            d += tmp6 + 0xc040b340 + ((a & c) | (b & ~c)); d = a + ((d <<  9) | (d >>> 23));
            c += tmpb + 0x265e5a51 + ((d & b) | (a & ~b)); c = d + ((c << 14) | (c >>> 18));
            b += tmp0 + 0xe9b6c7aa + ((c & a) | (d & ~a)); b = c + ((b << 20) | (b >>> 12));
            a += tmp5 + 0xd62f105d + ((b & d) | (c & ~d)); a = b + ((a <<  5) | (a >>> 27));
            d += tmpa + 0x02441453 + ((a & c) | (b & ~c)); d = a + ((d <<  9) | (d >>> 23));
            c += tmpf + 0xd8a1e681 + ((d & b) | (a & ~b)); c = d + ((c << 14) | (c >>> 18));
            b += tmp4 + 0xe7d3fbc8 + ((c & a) | (d & ~a)); b = c + ((b << 20) | (b >>> 12));
            a += tmp9 + 0x21e1cde6 + ((b & d) | (c & ~d)); a = b + ((a <<  5) | (a >>> 27));
            d += tmpe + 0xc33707d6 + ((a & c) | (b & ~c)); d = a + ((d <<  9) | (d >>> 23));
            c += tmp3 + 0xf4d50d87 + ((d & b) | (a & ~b)); c = d + ((c << 14) | (c >>> 18));
            b += tmp8 + 0x455a14ed + ((c & a) | (d & ~a)); b = c + ((b << 20) | (b >>> 12));
            a += tmpd + 0xa9e3e905 + ((b & d) | (c & ~d)); a = b + ((a <<  5) | (a >>> 27));
            d += tmp2 + 0xfcefa3f8 + ((a & c) | (b & ~c)); d = a + ((d <<  9) | (d >>> 23));
            c += tmp7 + 0x676f02d9 + ((d & b) | (a & ~b)); c = d + ((c << 14) | (c >>> 18));
            b += tmpc + 0x8d2a4c8a + ((c & a) | (d & ~a)); b = c + ((b << 20) | (b >>> 12));
            a += tmp5 + 0xfffa3942 + ((b ^ c) ^ d); a = b + ((a <<  4) | (a >>> 28));
            d += tmp8 + 0x8771f681 + ((a ^ b) ^ c); d = a + ((d << 11) | (d >>> 21));
            c += tmpb + 0x6d9d6122 + ((d ^ a) ^ b); c = d + ((c << 16) | (c >>> 16));
            b += tmpe + 0xfde5380c + ((c ^ d) ^ a); b = c + ((b << 23) | (b >>>  9));
            a += tmp1 + 0xa4beea44 + ((b ^ c) ^ d); a = b + ((a <<  4) | (a >>> 28));
            d += tmp4 + 0x4bdecfa9 + ((a ^ b) ^ c); d = a + ((d << 11) | (d >>> 21));
            c += tmp7 + 0xf6bb4b60 + ((d ^ a) ^ b); c = d + ((c << 16) | (c >>> 16));
            b += tmpa + 0xbebfbc70 + ((c ^ d) ^ a); b = c + ((b << 23) | (b >>>  9));
            a += tmpd + 0x289b7ec6 + ((b ^ c) ^ d); a = b + ((a <<  4) | (a >>> 28));
            d += tmp0 + 0xeaa127fa + ((a ^ b) ^ c); d = a + ((d << 11) | (d >>> 21));
            c += tmp3 + 0xd4ef3085 + ((d ^ a) ^ b); c = d + ((c << 16) | (c >>> 16));
            b += tmp6 + 0x04881d05 + ((c ^ d) ^ a); b = c + ((b << 23) | (b >>>  9));
            a += tmp9 + 0xd9d4d039 + ((b ^ c) ^ d); a = b + ((a <<  4) | (a >>> 28));
            d += tmpc + 0xe6db99e5 + ((a ^ b) ^ c); d = a + ((d << 11) | (d >>> 21));
            c += tmpf + 0x1fa27cf8 + ((d ^ a) ^ b); c = d + ((c << 16) | (c >>> 16));
            b += tmp2 + 0xc4ac5665 + ((c ^ d) ^ a); b = c + ((b << 23) | (b >>>  9));
            a += tmp0 + 0xf4292244 + (c ^ (~d | b)); a = b + ((a <<  6) | (a >>> 26));
            d += tmp7 + 0x432aff97 + (b ^ (~c | a)); d = a + ((d << 10) | (d >>> 22));
            c += tmpe + 0xab9423a7 + (a ^ (~b | d)); c = d + ((c << 15) | (c >>> 17));
            b += tmp5 + 0xfc93a039 + (d ^ (~a | c)); b = c + ((b << 21) | (b >>> 11));
            a += tmpc + 0x655b59c3 + (c ^ (~d | b)); a = b + ((a <<  6) | (a >>> 26));
            d += tmp3 + 0x8f0ccc92 + (b ^ (~c | a)); d = a + ((d << 10) | (d >>> 22));
            c += tmpa + 0xffeff47d + (a ^ (~b | d)); c = d + ((c << 15) | (c >>> 17));
            b += tmp1 + 0x85845dd1 + (d ^ (~a | c)); b = c + ((b << 21) | (b >>> 11));
            a += tmp8 + 0x6fa87e4f + (c ^ (~d | b)); a = b + ((a <<  6) | (a >>> 26));
            d += tmpf + 0xfe2ce6e0 + (b ^ (~c | a)); d = a + ((d << 10) | (d >>> 22));
            c += tmp6 + 0xa3014314 + (a ^ (~b | d)); c = d + ((c << 15) | (c >>> 17));
            b += tmpd + 0x4e0811a1 + (d ^ (~a | c)); b = c + ((b << 21) | (b >>> 11));
            a += tmp4 + 0xf7537e82 + (c ^ (~d | b)); a = b + ((a <<  6) | (a >>> 26));
            d += tmpb + 0xbd3af235 + (b ^ (~c | a)); d = a + ((d << 10) | (d >>> 22));
            c += tmp2 + 0x2ad7d2bb + (a ^ (~b | d)); c = d + ((c << 15) | (c >>> 17));
            b += tmp9 + 0xeb86d391 + (d ^ (~a | c)); b = c + ((b << 21) | (b >>> 11));

            this.a_ = (this.a_ + a) & 0xffffffff;
            this.b_ = (this.b_ + b) & 0xffffffff;
            this.c_ = (this.c_ + c) & 0xffffffff;
            this.d_ = (this.d_ + d) & 0xffffffff;
        },

        fillzero : function(size) {
            var buf = "";
            for (var i = 0; i < size; i++) {
                buf += "\x00";
            }
            return buf;
        },

        main : function(buf, bufSize, update, self, charSize) {
            if (charSize == 1) {
                var totalBitSize = bufSize * 8;
                while (bufSize >= 64) {
                    self[update](buf, charSize);
                    buf = buf.substr(64);
                    bufSize -= 64;
                }
                buf +="\x80";
                if (bufSize >= 56) {
                    buf += this.fillzero(63 - bufSize);
                    self[update](buf, charSize);
                    buf = this.fillzero(56);
                } else {
                    buf += this.fillzero(55 - bufSize);
                }
                buf += String.fromCharCode(totalBitSize & 0xff, (totalBitSize >>> 8) & 0xff, (totalBitSize >>> 16) & 0xff, totalBitSize >>> 24);
                buf += "\x00\x00\x00\x00"; // in stead of (totalBitSize) >> 32
                self[update](buf, charSize);
            } else {
                /* charSize == 2 */
                var totalBitSize = bufSize * 16;
                while (bufSize >= 32) {
                    self[update](buf, charSize);
                    buf = buf.substr(32);
                    bufSize -= 32;
                }
                buf +="\x80";
                if (bufSize >= 28) {
                    buf += this.fillzero(31 - bufSize);
                    self[update](buf, charSize);
                    buf = this.fillzero(28);
                } else {
                    buf += this.fillzero(27 - bufSize);
                }
                buf += String.fromCharCode(totalBitSize & 0xffff, totalBitSize >>> 16);
                buf += "\x00\x00"; // in stead of (totalBitSize) >> 32
                self[update](buf, charSize);
            }
        },

        VERSION : "1.0",
        BY_ASCII : 0,
        BY_UTF16 : 1,

        calc : function(msg, mode) {
            var charSize = (arguments.length == 2 && mode == this.BY_UTF16) ? 2 : 1;
            this.a_ = 0x67452301;
            this.b_ = 0xefcdab89;
            this.c_ = 0x98badcfe;
            this.d_ = 0x10325476;
            this.main(msg, msg.length, "update_std", this, charSize);
            return this.int2hex8(this.a_) + this.int2hex8(this.b_) + this.int2hex8(this.c_) + this.int2hex8(this.d_);
        }
    } // end of MD5
}; // end of CybozuLabs
