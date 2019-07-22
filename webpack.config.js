const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const mode = "development";
const sourcemap = mode === "development";
const DeployPlugin = require("./commands/deployPlugin").module;

var copyPattern = [
    {
        from: "./src/index.ts",
        to: "./"
    }
];

if (mode == "release") {
    copyPattern.push({
        from: "./src/task.prod",
        to: "./task.json"
    });
} else {
    copyPattern.push({
        from: "./src/task.preProd",
        to: "./task.json"
    });
}
var copyWebPackPlugin = new CopyWebpackPlugin(copyPattern);

const plugins = [
    new CleanWebpackPlugin({
        cleanStaleWebpackAssets: false
    }),
    copyWebPackPlugin,
    new DeployPlugin()
];

module.exports = {
    entry: {
        index: "./src/index.ts"
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "umd",
        library: "[name]"
    },
    devtool: "source-map",
    mode: mode,
    stats: {
        all: false,
        builtAt: true,
        cached: true,
        errors: true,
        performance: true,
        timings: true,
        warnings: true
    },
    node: {
        fs: "empty",
        child_process: "empty",
        net: "empty",
        tls: "empty"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".json"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            },
            {
                enforce: "pre",
                test: /\.js$/,
                use: [
                    {
                        loader: "source-map-loader"
                    }
                ]
            }
        ]
    },

    plugins: plugins
};
