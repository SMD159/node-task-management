const ARGS = {};

process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.split("=");
    if (key && value) {
        ARGS[key] = value;
    }
});

// pm2 start ecosystem.config.js --node-args "PM2_CONFIG_NAME=BKK_JAZZCASH_PROD"
// pm2 start ecosystem.config.js --node-args "PM2_CONFIG_NAME=BKK_JAZZCASH_STG"

const pm2Configs = {
    BKK_JAZZCASH_PROD: [
        {
            name: "bkk_jazzcash_prod_api",
            script: "node server.js -e prod.bkk.jazzcash.api"
        }
    ],
    BKK_JAZZCASH_STG: [
        {
            name: "bkk_jazzcash_stg_api",
            script: "node server.js -e stg.bkk.jazzcash.api"
        }
    ]
};

const logFilePath = "/pm2";
const config = pm2Configs[ARGS.PM2_CONFIG_NAME];
for (const iterator of config) {
    iterator.output = `${logFilePath}/${iterator.name}.out.log`;
    iterator.error = `${logFilePath}/${iterator.name}.error.log`;
}

module.exports = {
    apps: pm2Configs[ARGS.PM2_CONFIG_NAME]
};
