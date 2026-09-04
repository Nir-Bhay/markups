/**
 * Storehouse shim — drop-in replacement for storehouse-js (tanabe/Storehouse-js).
 * Same API surface (setItem/getItem/deleteItem/getInstance) with identical MD5
 * key hashing so existing data (stored under MD5(namespace-key)) remains readable.
 * Implemented directly on top of localStorage/sessionStorage — no external dep.
 * @module utils/storehouse-compat
 */

// MD5 implementation (port of the one bundled in storehouse-js, kept verbatim
// so hashed keys match byte-for-byte).
const MD5_T = [
    0x00000000, 0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613,
    0xfd469501, 0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e,
    0x49b40821, 0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681,
    0xe7d3fbc8, 0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9,
    0x8d2a4c8a, 0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60,
    0xbebfbc70, 0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8,
    0xc4ac5665, 0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d,
    0x85845dd1, 0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb,
    0xeb86d391
];
const MD5_F = (x, y, z) => (x & y) | (~x & z);
const MD5_G = (x, y, z) => (x & z) | (y & ~z);
const MD5_H = (x, y, z) => x ^ y ^ z;
const MD5_I = (x, y, z) => y ^ (x | ~z);
const MD5_ROUND = [
    [MD5_F, [[0,7,1],[1,12,2],[2,17,3],[3,22,4],[4,7,5],[5,12,6],[6,17,7],[7,22,8],[8,7,9],[9,12,10],[10,17,11],[11,22,12],[12,7,13],[13,12,14],[14,17,15],[15,22,16]]],
    [MD5_G, [[1,5,17],[6,9,18],[11,14,19],[0,20,20],[5,5,21],[10,9,22],[15,14,23],[4,20,24],[9,5,25],[14,9,26],[3,14,27],[8,20,28],[13,5,29],[2,9,30],[7,14,31],[12,20,32]]],
    [MD5_H, [[13,6,45],[3,10,46],[10,15,47],[1,21,48],[8,6,49],[15,10,50],[6,15,51],[13,21,52],[4,6,53],[11,10,54],[2,15,55],[9,21,56],[12,6,57],[7,10,58],[14,15,59],[5,21,60]]],
    [MD5_I, [[0,6,49],[7,10,50],[14,15,51],[5,21,52],[12,6,53],[3,10,54],[10,15,55],[1,21,56],[8,6,57],[15,10,58],[6,15,59],[13,21,60],[4,6,61],[11,10,62],[2,15,63],[9,21,64]]]
];
const MD5_pack = (n) =>
    String.fromCharCode(n & 0xff) +
    String.fromCharCode((n >>> 8) & 0xff) +
    String.fromCharCode((n >>> 16) & 0xff) +
    String.fromCharCode((n >>> 24) & 0xff);
const MD5_number = (n) => {
    while (n < 0) n += 4294967296;
    while (n > 4294967295) n -= 4294967296;
    return n;
};
const MD5_applyRound = (x, s, f, abcd, r) => {
    const [a, b, c, d] = abcd;
    const [kk, ss, ii] = r;
    const u = f(s[b], s[c], s[d]);
    let t = s[a] + u + x[kk] + MD5_T[ii];
    t = MD5_number(t);
    t = ((t << ss) | (t >>> (32 - ss)));
    t += s[b];
    s[a] = MD5_number(t);
};
const MD5_hash = (rawData) => {
    let data = rawData;
    const abcd = [0, 1, 2, 3];
    const x = new Array(16);
    const s = new Array(4);
    let len = data.length;
    let index = len & 0x3f;
    let padLen = (index < 56) ? (56 - index) : (120 - index);
    if (padLen > 0) {
        data += '\x80';
        for (let i = 0; i < padLen - 1; i++) data += '\x00';
    }
    data += MD5_pack(len * 8);
    data += MD5_pack(0);
    len += padLen + 8;
    const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];
    for (let k = 0; k < len; k += 64) {
        for (let i = 0, j = k; i < 16; i++, j += 4) {
            x[i] = data.charCodeAt(j) |
                (data.charCodeAt(j + 1) << 8) |
                (data.charCodeAt(j + 2) << 16) |
                (data.charCodeAt(j + 3) << 24);
        }
        for (let i = 0; i < 4; i++) s[i] = state[i];
        for (let i = 0; i < 4; i++) {
            const [f, r] = MD5_ROUND[i];
            for (let j = 0; j < 16; j++) {
                MD5_applyRound(x, s, f, abcd, r[j]);
                const tmp = abcd[0];
                abcd[0] = abcd[3];
                abcd[3] = abcd[2];
                abcd[2] = abcd[1];
                abcd[1] = tmp;
            }
        }
        for (let i = 0; i < 4; i++) {
            state[i] += s[i];
            state[i] = MD5_number(state[i]);
        }
    }
    return MD5_pack(state[0]) + MD5_pack(state[1]) + MD5_pack(state[2]) + MD5_pack(state[3]);
};
const MD5_hexhash = (rawData) => {
    const bit128 = MD5_hash(rawData);
    let out = '';
    for (let i = 0; i < 16; i++) {
        const c = bit128.charCodeAt(i);
        out += '0123456789abcdef'.charAt((c >> 4) & 0xf);
        out += '0123456789abcdef'.charAt(c & 0xf);
    }
    return out;
};

const createKey = (namespace, key) => MD5_hexhash([namespace, key].join('-'));

class Storehouse {
    static getItem(namespace, key) {
        try {
            const storageKey = createKey(namespace, key);
            let item = null;
            try { item = JSON.parse(sessionStorage.getItem(storageKey)); } catch {}
            if (!item) {
                try { item = JSON.parse(localStorage.getItem(storageKey)); } catch {}
            }
            if (!item) return undefined;
            const value = item.value;
            const expire = Number(item.expire);
            if (expire) {
                if (expire > Date.now()) return value;
                // expired — clean up
                try { sessionStorage.removeItem(storageKey); } catch {}
                try { localStorage.removeItem(storageKey); } catch {}
                return undefined;
            }
            return value;
        } catch {
            return undefined;
        }
    }

    static setItem(namespace, key, value, expire) {
        const storageKey = createKey(namespace, key);
        const item = { namespace, key, value };
        if (expire) {
            item.expire = (expire instanceof Date) ? expire.getTime() : Number(expire);
            try { localStorage.setItem(storageKey, JSON.stringify(item)); } catch {}
        } else {
            try { sessionStorage.setItem(storageKey, JSON.stringify(item)); } catch {}
        }
    }

    static deleteItem(namespace, key) {
        const storageKey = createKey(namespace, key);
        try { sessionStorage.removeItem(storageKey); } catch {}
        try { localStorage.removeItem(storageKey); } catch {}
    }

    static getInstance(namespace) {
        return {
            getItem: (key) => Storehouse.getItem(namespace, key),
            setItem: (key, value, expire) => Storehouse.setItem(namespace, key, value, expire),
            deleteItem: (key) => Storehouse.deleteItem(namespace, key)
        };
    }
}

export default Storehouse;
