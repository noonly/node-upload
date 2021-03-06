var ffmpeg = require('fluent-ffmpeg');
var http = require('http'), path = require('path')
/*  os = require('os'),*/
var fs = require('fs');
const uuidV4 = require('uuid/v4');
/*var imageinfo = require('imageinfo');*/
var sha1File = require('sha1-file')
var Busboy = require('busboy');
var dir = "/var/data/image/"
http.createServer(function (req, res) {
    if (req.method === 'GET') {
        res.writeHead(200, {'Connection': 'close'});
        res.end();
    } else if (req.method === 'POST') {
        var busboy = new Busboy({headers: req.headers});
        var dataarray = [];
        var finisharray = [];
        var count = 0;

        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) { /*if (!fieldname){return} console.log("field1:"+fieldname);*/
            if(filename){
                count++;
                //valid file count
            }
            var f = uuidV4();

            var saveTo = path.join(dir, path.basename(f));

            file.pipe(fs.createWriteStream(saveTo));
            dataarray.push(f);
        });
        busboy.on('finish', function () { /*console.log(filesha1+"--"+tmpfile);*/
            dataarray.forEach(function(file){

                var tmpfile = dir + "" + file;
                try {
                    sha1File(tmpfile,function (error, filesha1) {
                        if (error) return console.log(error)
                        var suffix;
                        ffmpeg.ffprobe(tmpfile, function (err, metadata) {
                            if (err) {
                                fs.unlink(tmpfile, function (err) {
                                    console.log("success2");
                                })
                                /*res.writeHead(200);
                                res.end('{"msg":"0","info":"unlink"}');
                                return;*/
                            } else {
                                var mediainfo;
                                var mediatype;// = metadata.streams[0].codec_name;
                                if (metadata.streams[0].codec_type == "video"){
                                    mediainfo = metadata.streams[0];
                                }else{
                                    mediainfo = metadata.streams[1];
                                }
                                mediatype = mediainfo.codec_name;
                                /*console.log(metadata.streams[0]);*/
                                console.dir(mediatype);
                                var transfer = false;
                                if (mediatype === 'tscc') {
                                    suffix = 'avi';
                                    transfer = true;
                                } else if (mediatype === "h264" || mediatype === 'mpeg4') {
                                    suffix = 'mp4';
                                } else if (mediatype === "wmv2") {
                                    suffix = 'wmv';
                                    transfer = true;
                                } else if (mediatype === "mjpeg") {
                                    suffix = 'jpg';
                                } else if (mediatype === "png") {
                                    suffix = 'png';
                                } else if (mediatype === "gif") {
                                    suffix = 'gif';
                                }


                                if (suffix == undefined) {
                                    fs.unlink(tmpfile, function (err) {
                                        console.log("success")
                                    });
                                    res.writeHead(200);
                                    res.end('{"msg":"0","info":"file type undefined"}');
                                    return;
                                }

                                var height = mediainfo.coded_height;
                                var width = mediainfo.coded_width;
                                //var bit_rate = metadata.streams[0].bit_rate;
                                //var r_frame_rate = metadata.streams[0]r_frame_rate;
                                var ratio = height / width;
                                var newfile = filesha1 + "_" + ratio.toFixed(4) + "_." + suffix;




                                fs.rename(tmpfile, dir + "" + newfile, function () {
                                });
                                if (typeof(mediainfo.duration) == "number") {

                                    if (transfer) {

                                        ffmpeg(dir + "/" + newfile)
                                            .withVideoBitrate('128k')
                                            .withFps(24)
                                            .withAspect(ratio)
                                            //.withSize(size)
                                            .saveToFile(dir + "/" + newfile + '.mp4', function (stdout, stderr) {
                                                console.log('file has been converted succesfully');
                                            });

                                    }

                                    //console.log(typeof(mediainfo.duration));
                                    try {
                                        ffmpeg(dir + "/" + newfile).screenshots({
                                            timestamps: ['0'],
                                            filename: newfile + '.png',
                                            folder: dir
                                        }).on('error', function (err) {
                                            console.log('An error occurred: ' + err.message);
                                        });
                                    } catch (e) {
                                        res.writeHead(200, {'Connection': 'close'});
                                        res.end('{"msg":"0","info":"screenshots"}');
                                        console.log(newfile)
                                    }
                                }
                                //console.log(tmpfile+"=="+newfile);
                                var j = 0;
                                for(var i=0;i < dataarray.length;i++){
                                    if(dataarray[i] == file)
                                    {
                                        count--;
                                        j = i;
                                        break;
                                    }
                                }
                                finisharray[j] = newfile;
                                if(count == 0) {
                                    res.writeHead(200, {'Connection': 'close'});
                                    res.end("{\"msg\":\"1\",\"name\":\"" + finisharray + "\",\"count\":"+finisharray.length+"}");
                                }

                            }
                        });
                    });
                } catch (e) {
                    res.writeHead(500, {'Connection': 'close'});
                    res.end("file type error");
                    return
                }

            });
            //    res.writeHead(200, { 'Connection': 'close' });
              //res.end("That's all folks!");
        });
        return req.pipe(busboy);
    }
    res.writeHead(404);
    res.end();
}).listen(3000, function () {
    console.log('Listening for requests, port:3000');
});