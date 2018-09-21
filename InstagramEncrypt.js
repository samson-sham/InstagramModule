// ConsumerCommon.js:4733
function InstagramEncryptionFunction(o) {
    "use strict";

    function i(e, t) {
        var n = (65535 & e) + (65535 & t);
        return (e >> 16) + (t >> 16) + (n >> 16) << 16 | 65535 & n
    }

    function a(e, t, n, r, o, a) {
        return i((u = i(i(t, e), i(r, a))) << (c = o) | u >>> 32 - c, n);
        var u, c
    }

    function u(e, t, n, r, o, i, u) {
        return a(t & n | ~t & r, e, t, o, i, u)
    }

    function c(e, t, n, r, o, i, u) {
        return a(t & r | n & ~r, e, t, o, i, u)
    }

    function s(e, t, n, r, o, i, u) {
        return a(t ^ n ^ r, e, t, o, i, u)
    }

    function l(e, t, n, r, o, i, u) {
        return a(n ^ (t | ~r), e, t, o, i, u)
    }

    function d(e, t) {
        var n, r, o, a, d;
        e[t >> 5] |= 128 << t % 32, e[14 + (t + 64 >>> 9 << 4)] = t;
        var f = 1732584193,
            p = -271733879,
            g = -1732584194,
            _ = 271733878;
        for (n = 0; n < e.length; n += 16) r = f, o = p, a = g, d = _, p = l(p = l(p = l(p = l(p = s(p = s(p = s(p = s(p = c(p = c(p = c(p = c(p = u(p = u(p = u(p = u(p, g = u(g, _ = u(_, f = u(f, p, g, _, e[n], 7, -680876936), p, g, e[n + 1], 12, -389564586), f, p, e[n + 2], 17, 606105819), _, f, e[n + 3], 22, -1044525330), g = u(g, _ = u(_, f = u(f, p, g, _, e[n + 4], 7, -176418897), p, g, e[n + 5], 12, 1200080426), f, p, e[n + 6], 17, -1473231341), _, f, e[n + 7], 22, -45705983), g = u(g, _ = u(_, f = u(f, p, g, _, e[n + 8], 7, 1770035416), p, g, e[n + 9], 12, -1958414417), f, p, e[n + 10], 17, -42063), _, f, e[n + 11], 22, -1990404162), g = u(g, _ = u(_, f = u(f, p, g, _, e[n + 12], 7, 1804603682), p, g, e[n + 13], 12, -40341101), f, p, e[n + 14], 17, -1502002290), _, f, e[n + 15], 22, 1236535329), g = c(g, _ = c(_, f = c(f, p, g, _, e[n + 1], 5, -165796510), p, g, e[n + 6], 9, -1069501632), f, p, e[n + 11], 14, 643717713), _, f, e[n], 20, -373897302), g = c(g, _ = c(_, f = c(f, p, g, _, e[n + 5], 5, -701558691), p, g, e[n + 10], 9, 38016083), f, p, e[n + 15], 14, -660478335), _, f, e[n + 4], 20, -405537848), g = c(g, _ = c(_, f = c(f, p, g, _, e[n + 9], 5, 568446438), p, g, e[n + 14], 9, -1019803690), f, p, e[n + 3], 14, -187363961), _, f, e[n + 8], 20, 1163531501), g = c(g, _ = c(_, f = c(f, p, g, _, e[n + 13], 5, -1444681467), p, g, e[n + 2], 9, -51403784), f, p, e[n + 7], 14, 1735328473), _, f, e[n + 12], 20, -1926607734), g = s(g, _ = s(_, f = s(f, p, g, _, e[n + 5], 4, -378558), p, g, e[n + 8], 11, -2022574463), f, p, e[n + 11], 16, 1839030562), _, f, e[n + 14], 23, -35309556), g = s(g, _ = s(_, f = s(f, p, g, _, e[n + 1], 4, -1530992060), p, g, e[n + 4], 11, 1272893353), f, p, e[n + 7], 16, -155497632), _, f, e[n + 10], 23, -1094730640), g = s(g, _ = s(_, f = s(f, p, g, _, e[n + 13], 4, 681279174), p, g, e[n], 11, -358537222), f, p, e[n + 3], 16, -722521979), _, f, e[n + 6], 23, 76029189), g = s(g, _ = s(_, f = s(f, p, g, _, e[n + 9], 4, -640364487), p, g, e[n + 12], 11, -421815835), f, p, e[n + 15], 16, 530742520), _, f, e[n + 2], 23, -995338651), g = l(g, _ = l(_, f = l(f, p, g, _, e[n], 6, -198630844), p, g, e[n + 7], 10, 1126891415), f, p, e[n + 14], 15, -1416354905), _, f, e[n + 5], 21, -57434055), g = l(g, _ = l(_, f = l(f, p, g, _, e[n + 12], 6, 1700485571), p, g, e[n + 3], 10, -1894986606), f, p, e[n + 10], 15, -1051523), _, f, e[n + 1], 21, -2054922799), g = l(g, _ = l(_, f = l(f, p, g, _, e[n + 8], 6, 1873313359), p, g, e[n + 15], 10, -30611744), f, p, e[n + 6], 15, -1560198380), _, f, e[n + 13], 21, 1309151649), g = l(g, _ = l(_, f = l(f, p, g, _, e[n + 4], 6, -145523070), p, g, e[n + 11], 10, -1120210379), f, p, e[n + 2], 15, 718787259), _, f, e[n + 9], 21, -343485551), f = i(f, r), p = i(p, o), g = i(g, a), _ = i(_, d);
        return [f, p, g, _]
    }

    function f(e) {
        var t, n = "",
            r = 32 * e.length;
        for (t = 0; t < r; t += 8) n += String.fromCharCode(e[t >> 5] >>> t % 32 & 255);
        return n
    }

    function p(e) {
        var t, n = [];
        for (n[(e.length >> 2) - 1] = void 0, t = 0; t < n.length; t += 1) n[t] = 0;
        var r = 8 * e.length;
        for (t = 0; t < r; t += 8) n[t >> 5] |= (255 & e.charCodeAt(t / 8)) << t % 32;
        return n
    }

    function g(e) {
        var t, n, r = "";
        for (n = 0; n < e.length; n += 1) t = e.charCodeAt(n), r += "0123456789abcdef".charAt(t >>> 4 & 15) + "0123456789abcdef".charAt(15 & t);
        return r
    }

    function _(e) {
        return unescape(encodeURIComponent(e))
    }

    function b(e) {
        return function(e) {
            return f(d(p(e), 8 * e.length))
        }(_(e))
    }

    function m(e, t) {
        return function(e, t) {
            var n, r, o = p(e),
                i = [],
                a = [];
            for (i[15] = a[15] = void 0, o.length > 16 && (o = d(o, 8 * e.length)), n = 0; n < 16; n += 1) i[n] = 909522486 ^ o[n], a[n] = 1549556828 ^ o[n];
            return r = d(i.concat(p(t)), 512 + 8 * t.length), f(d(a.concat(r), 640))
        }(_(e), _(t))
    }

    function y(e, t, n) {
        return t ? n ? m(t, e) : g(m(t, e)) : n ? b(e) : g(b(e))
    }
    return y;
}
class InstagramEncrypt {
    constructor(sharedData = {}) {
        this.rhx_gis = sharedData.rhx_gis;
        this.encrypt = InstagramEncryptionFunction();
    }
    obtainXHRSignature(query) {
        let queryObjectString = 
            typeof query === 'string' ? 
                query : 
                query ? JSON.stringify(query) : "";
        return this.encrypt(`${this.rhx_gis}:${queryObjectString}`);
    }
}
module.exports = exports = InstagramEncrypt;