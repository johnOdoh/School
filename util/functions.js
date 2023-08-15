const crypto = require('crypto');

module.exports = class Functions {
    constructor() {
        this.password = 'ojisdasjdsjabdjs';
        this.iv = 'kiamdksndn';
    }

    sha1(input) {
        return crypto.createHash('sha1').update(input).digest();
    }

    password_derive_bytes(password, salt, iterations, len) {
        var key = Buffer.from(password + salt);
        for (var i = 0; i < iterations; i++) {
            key = sha1(key);
        }
        if (key.length < len) {
            var hx = password_derive_bytes(password, salt, iterations - 1, 20);
            for (var counter = 1; key.length < len; ++counter) {
                key = Buffer.concat([key, sha1(Buffer.concat([Buffer.from(counter.toString()), hx]))]);
            }
        }
        return Buffer.alloc(len, key);
    }

    static encode(string) {
        var key = password_derive_bytes(this.password, '', 100, 32);
        var cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.from(this.iv));
        var part1 = cipher.update(string, 'utf8');
        var part2 = cipher.final();
        const encrypted = Buffer.concat([part1, part2]).toString('base64');
        return encrypted;
    }

    static decode(string) {
        var key = password_derive_bytes(this.password, '', 100, 32);
        var decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(this.iv));
        var decrypted = decipher.update(string, 'base64', 'utf8');
        decrypted += decipher.final();
        return decrypted;
    }
}