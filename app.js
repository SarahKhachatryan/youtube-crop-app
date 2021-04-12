const axios = require('axios');
const express = require('express');
const lodash =  require('lodash');
const he = require('he');
const striptags = require('striptags');
const find = lodash.find;
const app = express();
/**Function to get VideoID from Youtube video url*/
function getVideoID(url){
    let video_id = url.split('v=')[1];
    let ampersandPosition = video_id.indexOf('&');
    if(ampersandPosition != -1) {
        video_id = video_id.substring(0, ampersandPosition);
    }
return video_id;
}

 async function getSubtitles(videoID, lang = 'ru',){
   const {data} =  await axios.get(`https://youtube.com/get_video_info?video_id=${videoID}`);
   const decoded = decodeURIComponent(data);
   //console.log(JSON.parse(`{${decoded}}`));
     if (decoded.includes('captionTracks'))
       console.log("found");

     const regex = /({"captionTracks":.*isTranslatable":(true|false)}])/;
     const [match] = regex.exec(decoded);
     const { captionTracks } = JSON.parse(`${match}}`);
     const subtitle =
         find(captionTracks, {
             vssId: `.${lang}`,
         }) ||
         find(captionTracks, {
             vssId: `a.${lang}`,
         }) ||
         find(captionTracks, ({ vssId }) => vssId && vssId.match(`.${lang}`));
     //const data1 = await axios.get(subtitle.baseUrl);
     const { data: transcript } = await axios.get(subtitle.baseUrl);
     const lines = transcript.replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
         .replace('</transcript>', '')
         .split('</text>')
         .map(line => {
             const startRegex = /start="([\d.]+)"/;
             const durRegex = /dur="([\d.]+)"/;

             // const [, start] = startRegex.exec(line);
             // const [, dur] = durRegex.exec(line);

             const htmlText = line
                 .replace(/<text.+>/, '')
                 .replace(/&amp;/gi, '&')
                 .replace(/<\/?[^>]+(>|$)/g, '');

             const decodedText = he.decode(htmlText);
             const text = striptags(decodedText);

             return {
                // start,
                // dur,
                 text,
             };
         })

     console.log(lines);
   return captionTracks;
}
//getSubtitles(getVideoID("https://www.youtube.com/watch?v=3KbUohmn7UE")).then(r => console.log(r));

app.get('/get-data',(req,res,next)=>{
    res.send(getSubtitles(getVideoID("https://www.youtube.com/watch?v=3KbUohmn7UE")));
})
app.listen(3000,()=>{console.log('listening on port 3000')});