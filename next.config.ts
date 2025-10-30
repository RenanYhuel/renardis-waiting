import type { NextConfig } from "next";

import webpack from "webpack";

const nextConfig: NextConfig = {
    output: "standalone",
    webpack(config) {
        config.plugins = config.plugins || [];
        config.plugins.push(
            new webpack.IgnorePlugin({
                resourceRegExp:
                    /^mysql$|^pg$|^oracledb$|^mssql$|^mongodb$|^redis$|^nats$|^react-native-sqlite-storage$|^@sap\/hana-client\/extension\/Stream$/,
            })
        );
        config.plugins.push(
            new webpack.ContextReplacementPlugin(
                /typeorm[\\/]platform[\\/]PlatformTools\.js/,
                (data) => {
                    if (typeof data !== "object") return;
                    Object.assign(data, {
                        context: __dirname,
                        request: ".",
                    });
                }
            )
        );
        return config;
    },
};

export default nextConfig;
