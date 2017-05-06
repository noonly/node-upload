# node-upload
This library abstracts the complex command-line usage of ffmpeg.
Install ffmpeg before use this process.
This project build on Ubuntu linux operation system.

# request with curl
allow file type: png jpg gif mp4
curl -F "file=@/sample.jpg" "http://domainname:3000"
# response
{'msg':'1','name':'e2555e8c7fe2a23561655d6e8f0365ab1cbb963a_1.0000_.png','count':1}

msg = 0|1 A sign of success
name = real filename on server, 1.0000 is picture or video's width and height ratio
count = upload successfully file count
