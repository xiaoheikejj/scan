
var bool_isAndro = false,
    maxshowheight = 0;

var videos = document.getElementById('testVideo');
videos.preload = "auto";
videos.volume = 0.3;
videos.loop = 'loop';

var baseUrl = "https://demo.magicreal.net/agent";

document.addEventListener("DOMContentLoaded", function() {
        // getTheme的值
        var compareData = [],
        // getTheme符合放入的值
            newCompareData = [];
        var flag = 0;
        var startScan = 0;
        var scanInterval,
            interval;
        //同意授权
        function geoSuccess(event) {
            var gps = [event.coords.longitude, event.coords.latitude];
            AMap.convertFrom(gps, 'gps', function (status, result) {
                if (result.info === 'ok') {
                    var lnglats = result.locations; // Array.<LngLat>
                    var markerLat = lnglats[0];
                    try{
                        if (compareData.length > 0) {
                            //在遍历之前先清空数组
                            newCompareData = [];
                            compareData.forEach(function(item) {
                                var targetGPS = new AMap.LngLat(item.longitude, item.latitude);
                                var dis = Math.round(targetGPS.distance(lnglats[0]));
                                if (item.radius > dis) {
                                    // 把符合的值放新数组
                                    newCompareData.push(item);
                                    $("#distance-text").show();
                                    $("#distance-status").on("click", function() {
                                        // alert("我被点击了");
                                        $(this).text("已开启扫描");
                                        $("#distance-text").hide();
                                        //让左上角显示的颜色变成绿色
                                        $("#distance-status").css("background-color","#00FF00");
                                        //开启扫描的信号
                                        startScan = 1;
                                        //当大于0的时停掉定位计时器
                                        flag = 1;
                                    })
                                }
                            })
                        }
                    }catch(e){
                        alert(e);
                    }
                }
            });
        }
        
        //拒绝授权
        function geoError(event) {
            alert('error');
            alert("Error code " + event.code + ". " + event.message);
        }
        
        //调用定位系统
        function agree_obtain_location(){
            var option = {
                enableHighAccuracy : true,
                timeout : Infinity,
                maximumAge : 0
            };
            navigator.geolocation.getCurrentPosition(geoSuccess,geoError,option);
        }

        var themeID,
            userID,
            companyID,
            productID;
        $.ajax({
            url: baseUrl + "/wx/getIds",
            type: "post",
            async: false,
            data: {
                openID: 1
            },
            xhrFields: {withCredentials: true},
            success: function(res){
                themeID = res.data.themeID;
                userID = res.data.userID;
                companyID = res.data.companyID;
                productID = res.data.productID;
            }
        })
        var params = {
            themeID: themeID,
            userID: userID,
            companyID: companyID,
            productID: productID
        };
        //请求主题里面的内容
        $.ajax({
            url: baseUrl + "/lbsAr/getLbsTheme",
            type: "post",
            data: params,
            xhrFields: {withCredentials: true},
            success: function(res) {
                // 将res.data里面的数据赋值给compareData
                compareData = res.data;
            }
        })
        var pageIOS = document.getElementsByClassName('webAR-index-iOS')[0];
        var ua = navigator.userAgent.toLowerCase(),
            isWechat = 1,
            is_iOS = 1;
        if (/iphone|ipad|ipod/.test(ua)) {
            is_iOS = 2;
        } else if (/android/.test(ua)) {
            is_iOS = 1;
        }
        if (ua.match(/MicroMessenger/i) == "micromessenger") {
            isWechat = 2;
        } else {
            isWechat = 1;
        }
        if (is_iOS == 2 && isWechat == 2) {
            pageIOS.className = 'webAR-index-iOS';
            document.getElementById('start').className = 'dn';
            $("#distance-status").hide();
        } else {
            pageIOS.className = 'webAR-index-iOS dn';
        }

        if (!SPAR.checkBrowser()) {
            let res = confirm("检测到不支持的浏览器，可能无法正常运行，是否继续？")
            if (!res) return;
        }

        // Disables scrolling. Change as you need.
        document.ontouchmove = e => e.preventDefault();

        //用来停止计时器
        var boolrecognizer = 0;


        let result = document.getElementById('result');
        // let target = document.getElementById('target');
        let container = document.getElementById('container');


        let playButton = document.getElementById('play');
        let loadtext = document.getElementById('loadtext');
        let startButton = document.getElementById('start');
        let closeButton = document.getElementById('close');
        playButton.style.display = "block";
        //loadtext.style.display = "block";
        if (is_iOS == 2 && isWechat == 2) { 
            playButton.style.display = "none";
        } else {
            playButton.style.display = "block";
        }
        let videoWidth = 640;
        let videoHeight = 480;
        if (SPAR.browser.ios) {
            videoWidth = 640;
            videoHeight = 480;
        }

        let containerWidth = window.innerWidth; //////container.clientWidth;
        let containerHeight = window.innerHeight;/////container.clientHeight;

        let videoDevice = new SPAR.VideoDevice({
            width: containerWidth,
            height: containerHeight
        });

        MyCheckDevice();

        var constraint = {
            audio: false,
            video: {
                width: videoWidth,
                height: videoHeight,
                facingMode: bool_isAndro ? {exact: "environment"} : 'enviroment'
            }
        };

        startButton.onclick = function() {
            startButton.style.display = 'none';
            document.getElementsByClassName('bg-contetn')[0].className = 'bg-contetn dn';
            //videos.play();
            //videos.pause();
            videoDevice.play()
            .then(() => {

                InitShowBG();

                let renderer = new SPAR.THREERenderer(videoDevice);
                container.appendChild(renderer.domElement);
                let widthoffset = (containerWidth - videoDevice.width) / 2;
                let heightoffset = (containerHeight - videoDevice.height) / 2;
                console.log("offset=" + widthoffset + "," + heightoffset);
                renderer.domElement.style.marginLeft = widthoffset;
                renderer.domElement.style.marginTop = heightoffset;

                let canvas = videoDevice._canvasElm;
                $("#imgs").append(videoDevice._canvasElm);
                let recognizer = new SPAR.Recognizer(videoDevice);
                recognizer.start("", function(err, res) {});

                //进入执行定位 5秒扫描一次坐标
                agree_obtain_location();
                //每个5秒刷新定位一次
                interval = setInterval(function() {
                    //当开启扫描信号大于0的时候开启扫描
                    if (startScan > 0) {
                        function gett() {
                            $("#imgLoading").hide();
                            var param = {
                                userID: userID,
                                companyID: companyID,
                                themeID: themeID,
                                productID: productID,
                                image: canvas.toDataURL("image/png").split("base64,")[1]
                            };
                            // alert("我开始扫描了");
                            $.ajax({
                                url: baseUrl + "/lbsAr/scanLbsAr",
                                type: "post",
                                xhrFields: {withCredentials: true},
                                data: param,
                                success: function(res) {
                                    // alert("我扫描到了" + res.msg);
                                    if (res.code == 1) {
                                        recognizer.stop();
                                        // var appearonce = $("#videos").hasClass("appearonce");
                                        // if (!appearonce) {
                                        newCompareData.forEach(function(item) {
                                            if (res.data == item.scanImgID) {
                                                document.getElementById("showimg01").style.display = "none";
                                                if (item.type == 1) {
                                                    imageStarts(item.url);
                                                } else if (item.type == 2) {
                                                    videoStarts(item.url);
                                                }
                                            }
                                        })
                                        $("#imgLoading").show();
                                        // }
                                        // $("#videos").addClass("appearonce");
                                    } else if (res.code == 0) {
                                        setTimeout(gett, 1000);
                                    }
                                }
                            })
                        };
                        gett();
                        clearInterval(interval);
                        return false;
                    }
                    if (flag > 0) {
                        clearInterval(interval);
                        return false;
                    }
                    if (startScan == 0 || flag == 0) {
                        agree_obtain_location();
                    }
                }, 5000);
                document.getElementById("close").onclick = function() {
                    // 状态回归初始值
                    flag = 0;
                    startScan = 0;
                    $("#videos").removeClass("appearonce");
                    $("#distance-status").css("background-color","#ff0000");
                    $("#distance-status").text("开启扫描");
                    hidetarget();
                    recognizer.start("", function(err, res) {});
                    document.getElementById("close").style.display = "none";
                    //进入执行定位 5秒扫描一次坐标
                    agree_obtain_location();
                    interval = setInterval(function() {
                        //当开启扫描信号大于0的时候开启扫描
                        if (startScan > 0) {
                            function getting() {
                                $("#imgLoading").hide();
                                var param = {
                                    userID: userID,
                                    companyID: companyID,
                                    themeID: themeID,
                                    productID: productID,
                                    image: canvas.toDataURL("image/png").split("base64,")[1]
                                };
                                // alert("我开始扫描了");
                                $.ajax({
                                    url: baseUrl + "/lbsAr/scanLbsAr",
                                    type: "post",
                                    xhrFields: {withCredentials: true},
                                    data: param,
                                    success: function(res) {
                                        // alert("我扫描到了" + res.msg);
                                        if (res.code == 1) {
                                            recognizer.stop();
                                            // var appearonce = $("#videos").hasClass("appearonce");
                                            // if (!appearonce) {
                                            newCompareData.forEach(function(item) {
                                                if (res.data == item.scanImgID) {
                                                    document.getElementById("showimg01").style.display = "none";
                                                    if (item.type == 1) {
                                                        imageStarts(item.url);
                                                    } else if (item.type == 2) {
                                                        videoStarts(item.url);
                                                    }
                                                }
                                            })
                                            $("#imgLoading").show();
                                            // }
                                            // $("#videos").addClass("appearonce");
                                        } else if (res.code == 0) {
                                            setTimeout(getting, 1000);
                                        }
                                    }
                                })
                            };
                            getting();
                            clearInterval(interval);
                            return false;
                        }
                        if (flag > 0) {
                            clearInterval(interval);
                            return false;
                        }
                        if (startScan == 0 || flag == 0) {
                            agree_obtain_location();
                        }
                    }, 5000);
                }
                // target.style.display = 'none';
            })
            .catch(err => {
                console.log('catch error', err);
            });
        }
       
        videoDevice.setVideoSource(new SPAR.CameraVideoSource(constraint))
        .then(() => {
                let videoRadio = videoDevice.videoWidth / videoDevice.videoHeight;
                //缩放
                if (videoDevice.width < videoDevice.height) {
                    videoDevice.width = videoDevice.height * videoRadio;
                } else {
                    videoDevice.height = videoDevice.width / videoRadio;
                }
                videoDevice.captureQuality = 1;
                playButton.style.display = "none";
                loadtext.style.display = "none";
                startButton.style.display = "none";
                document.getElementById("close").style.display="none";
        
                startButton.click();
            }
        ).catch(err => {
            // playButton.innerHTML = "载入失败";
            // console.log('error', err);
            // alert(`${err.name} : ${err.message}` + "__载入失败");
        });
}, false);
//停掉计时器


function MyCheckDevice() {
    var device = navigator.userAgent;
    console.log("device=" + device);
    //alert("device=" + device);
    var msg = new MobileDetect(device);
    var os = msg.os();
    var model = "";
    //
    if (os == "IOS") {

        bool_isAndro = false;
    }
    else if (os == "AndroidOS") {

        bool_isAndro = true;
    }
    else {
        bool_isAndro = false;
    }

    console.log("os=" + os);
    //alert(os);
    //alert("model=" + model);
    try{
        if (navigator.getUserMedia) {
            console.log("Support");
        }
        else {
            //alert("Not support in this browser");
            //nextbutton.style.display = 'block';
            // location.href = "/webar/index.html";
        }
    }catch(e){
        // location.href = "/webar/index.html";
    }
}


function InitShowBG() {
    if (window.innerHeight > window.innerWidth) {
        let l = window.innerWidth;
        l = l * 0.9;
        let bg = document.getElementById("showimg01");
        bg.style.width = l + "px";
        bg.style.height = l + "px";

        bg.style.left = (window.innerWidth - l) / 2 + "px";
        bg.style.top = (window.innerHeight - l) / 2 + "px";

        // let show = document.getElementById("showimg02");
        // show.style.width = l + "px";
        // show.style.height = l + "px";

        // show.style.left = (window.innerWidth - l) / 2 + "px";
        // show.style.top = (window.innerHeight - l) / 2 + "px";
        maxshowheight = l;
    }
    else {
        let l = window.innerHeight;
        l = l * 0.9;
        alert(window.innerHeight + "," + l);

        let bg = document.getElementById("showimg01");
        bg.style.width = l + "px";
        bg.style.height = l + "px";
        bg.style.top = (window.innerHeight - l) / 2 + "px";
        bg.style.left = (window.innerWidth - l) / 2 + "px";

        // let show = document.getElementById("showimg02");
        // show.style.width = l + "px";
        // show.style.height = l + "px";
        // show.style.top = (window.innerHeight - l) / 2 + "px";
        // show.style.left = (window.innerWidth - l) / 2 + "px";
        maxshowheight = l;
    }
    document.getElementById('showimg01').style.display = "block";
    //document.getElementById('showimg02').style.display = "block";
    // document.getElementById('loading').innerHTML = "请扫描";
    // document.getElementById('loading').style.color = "#ffffff";

}
function hidetarget(){
    document.getElementById('showimg01').style.display = "block";
    var nextVideo = document.getElementById('testVideo');
    nextVideo.className = 'v-center dn';
    var nextImage = document.getElementById('testimage');
    nextImage.className = 'v-center dn';
    var loadingimg = document.getElementById('loadingimg');
    loadingimg.className = 'v-center vn';
    nextImage.setAttribute("src","");
    //
    nextVideo.setAttribute("src","");
    nextVideo.pause();
    nextVideo.play();
    document.getElementById('videos').className = 'v-center dn';
}
function imageStarts(names) {

    var nextVideo = document.getElementById('testVideo');
    nextVideo.className = 'v-center dn';
    var nextImage = document.getElementById('testimage');
    nextImage.className = 'v-center dn';
    var loadingimg = document.getElementById('loadingimg');
    loadingimg.className = 'v-center vn';

    document.getElementById('videos').className = 'v-center';
    var loadingimg = document.getElementById('loadingimg');
    loadingimg.className = 'v-center';
    loadingimg.setAttribute("src","./images/loading.gif");
    
    //nextVideo.setAttribute("src",names);
    setTimeout(function () {
        loadingimg.className = 'v-center vn';
        
        nextImage = document.getElementById('testimage');
        nextImage.className = 'v-center';
        document.getElementById('close').style.display = "block";
        nextImage.setAttribute("src",names);
    }, 500)
}
function videoStarts(names) {

    // names = names.split('-')[0];
    var nextVideo = document.getElementById('testVideo');
    nextVideo.className = 'v-center dn';
    var nextImage = document.getElementById('testimage');
    nextImage.className = 'v-center dn';
    var loadingimg = document.getElementById('loadingimg');
    loadingimg.className = 'v-center vn';
    //names = 'test';
    var nextVideo = document.getElementById('testVideo');    
    document.getElementById('videos').className = 'v-center';
    //nextVideo.className = 'v-center vn';
    nextVideo.setAttribute("src",names);
    //  var loadingimg = document.getElementById('loadingimg');
    //  loadingimg.className = 'v-center';
    //  loadingimg.setAttribute("src","./images/loading.gif");
    document.getElementById('testVideo').autoplay=true;
    document.getElementById('testVideo').controls=true;
    document.getElementById('testVideo').loop=true;
    document.getElementById('testVideo').load();
    document.getElementById('testVideo').addEventListener('loadedmetadata', function() {
        this.currentTime = 1;
      }, false);
      
    setTimeout(function () {
        //loadingimg.className = 'v-center vn';
        document.getElementById('close').style.display = "block";
        document.getElementById('testVideo').className = 'v-center';
        document.getElementById('testVideo').play();
        document.getElementById('testVideo').pause();
        document.getElementById('testVideo').play();
       
    }, 500)

}


