const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/format.js',
    output: {
        filename: 'format.js',
        path: path.resolve(__dirname, 'dist'),
    },
};
