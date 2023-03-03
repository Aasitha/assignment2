const {Worker} = require("worker_threads");

const src = process.argv[2];

const sizes = [
{width: 1920},
{width: 1280},
{width: 640}
];

for (const size of sizes) {
const worker = new Worker(
    __dirname + "/resize-worker.js",
    {
        workerData: {
            src,
            ...size
        }
    }
);

}