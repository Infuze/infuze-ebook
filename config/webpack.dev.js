const path = require('path');
const webpack = require("webpack");
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const autoprefixer = require("autoprefixer");
const CleanWebpackPlugin = require('clean-webpack-plugin');
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
//const NodemonPlugin = require('nodemon-webpack-plugin');
const merge = require('webpack-merge');
const TARGET = process.env.npm_lifecycle_event;
const ARGV = require('yargs').argv;

let common = {

    output: {
        filename: 'infuze-ebook.js',
        //library: 'Ebook',
        //libraryTarget: 'var',
        path: path.resolve(__dirname, '../dist')
    },
    devServer: {
        contentBase: [
            path.join(__dirname, '../dist')
        ],
        open: true,
        watchContentBase: true,
        overlay: true,
        stats: {
            colors: true
        }
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                [
                                    '@babel/preset-env',
                                    {
                                        debug: true
                                    }
                                ]
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.html/,
                loader: 'file-loader?name=[name].[ext]'
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    //MiniCssExtractPlugin.loader,
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            options: {},
                            plugins: () => {
                                autoprefixer({ browsers: ['last 2 versions'] });
                            }
                        }
                    },
                    'sass-loader']
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                loader: 'file-loader',
                query: {
                    outputPath: './img/',
                    name: '[name].[ext]?[hash]'
                }

            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                loader: 'file-loader',
                exclude: /node_modules/,
                options: {
                    //name: 'css/fonts/[name].[ext]',
                    //mimetype: 'application/font-woff',
                    //name: "css/fonts/[name].[ext]",
                    name: '[name].[ext]',
                    outputPath: 'fonts'
                },
            }]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'style.css',
            publicPath: '../'
            //filename: "css/style.css",
            //chunkFilename: "[id].css"
        }),
        new CopyWebpackPlugin([
            { from: 'src/images', to: 'images' },
            { from: 'src/iquiz_assets', to: 'iquiz_assets' },
            { from: 'src/libs', to: 'libs' },
            //{ from: 'src/sample/iquiz_assets', to: '../sample/iquiz_assets' }
        ])
        //new NodemonPlugin(),
        //new webpack.HotModuleReplacementPlugin()
    ]
}


if (ARGV.mode === 'production') {
    module.exports = merge(common, {
        entry: ['./src/js/app.js', './src/index.html', './src/slides.html', './src/quiz.html', './src/media.html'],
        mode: "production",
        devtool: 'source-map',
        plugins: [
            new CleanWebpackPlugin(['dist/**/*'], {
                root: path.join(__dirname, '..'),
            })
        ],
        optimization: {
            minimizer: [
                new UglifyJsPlugin({
                    cache: true,
                    parallel: true,
                    sourceMap: true // set to true if you want JS source maps
                }),
                new OptimizeCSSAssetsPlugin({})
            ]
        },
    })
}

if (ARGV.mode === 'development') {
    module.exports = merge(common, {
        entry: ['./src/js/app.js', './src/index.html', './src/slides.html', './src/quiz.html', './src/media.html'],
        mode: "development",
        devtool: 'source-map',
        //devtool: 'eval-cheap-module-source-map',
    })
}
