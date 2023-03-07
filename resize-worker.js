const workerpool = require("workerpool");
const sharp = require('sharp');
const date=new Date();

async function resizeImage(src,a, b, username,filePath) {
    //console.log("function called");
    try {
        //console.log("function called");
        await sharp(src)
            .resize({
                width: a,
                height: b,
                fit:"fill"
            })
            .toFile(filePath);
        console.log(`${filePath}- ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`);
    } catch (error) {

        console.log(err);
    }
}
async function cropImage(src,a, b, c, d, username,filePath) {
    try {
        await sharp(src)
            .extract({ width: a, height: b, left: c, top: d })
            .toFile(filePath);
            console.log(`${filePath}- ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`);
    } catch (error) {
        console.log(error);
    }
}
async function changeFormat(src,format,username,filePath){
    try{
        await sharp(src).toFormat(format, {palette: true}).toFile(filePath);
        console.log(`${filePath}- ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}:${date.getMilliseconds()}`);
    }catch(error){
        console.log(error);
    }
}
workerpool.worker({ resize: resizeImage, crop: cropImage,format:changeFormat });


