function Post(name, url, counter, date, info, edit, comments, status, id) {
    this.name = name;
    this.url = url;
    this.counter = parseInt(counter);
    this.date = date;
    this.realDate = ParseDate(date);
    this.info = info;
    this.edit = url;
    this.comments = parseInt(comments);
    this.status = status;
    this.commentList = new Array();
    this.id = id;
    this.fullUrl = url;
}



function Comment(author, date, likes, ano) {
    this.author = author;
    this.date = date;
    this.likes = likes;
    this.ano = ano;
}


function PostSort(type, a, b) {
    if (type == "date") {
        return b.realDate - a.realDate;
    }
    else if (type == "date2") {
        return a.realDate - b.realDate;
    }
    else if (type == "counter") {
        return b.counter - a.counter;
    }
    else if (type == "info") {
        return b.info - a.info;
    }
    else if (type == "comments") {
        return b.comments - a.comments;
    }
}


function ParseDate(date) {
    if (date)
        return new Date(date.substring(6, 10), parseInt(date.substring(3, 5)) - 1, parseInt(date.substring(0, 2))
            , parseInt(date.substring(11, 13)), parseInt(date.substring(14, 16)));
    else return null;
}

var myPosts = [];
var hrefList = []
var mainColor = "rgb(150, 0, 0)";
var fuckSwitchShow = true;

var allPosts = [];
var isYourProfile = false;
var blogerName = null;


var loaderIco = "\\";
function ShowLoader(text) {
    if (loaderIco == "|")
        loaderIco = "/";
    else if (loaderIco == "/") {
        loaderIco = "-";
    }
    else if (loaderIco == "-") {
        loaderIco = "\\";
    }
    else if (loaderIco == "\\") {
        loaderIco = "|";
    }
    SetInfo(text + loaderIco);
}

function GetDataFromProfile(index) {
    linkToSearch = GetBaseUrl(index)
    $.ajax({
        url: linkToSearch,
        dataType: "html",
        success: function (data) {
            SetInfo("pobieram podstawowe dane ze strony - " + index);
            data = GetHtmlWithoutLodingData(data);
            data = $(data);
            data.find("#content article > header > h1 > a").map(function () { return $(this).attr("href") }).each(function (i, link) {
                var tab = link.split(",");
                id = tab[tab.length - 1].split(".")[0];
                allPosts.push(new Post(null, link, 0, null, false, null, null, 0, id));
            });

            if (data.find("a[href='" + GetBaseUrl(++index) + "']").length > 0) {
                GetDataFromProfile(index);
            }
            else {
                GetDataFromPost(0);
            }
        }
    })
}

function GetDataFromPost(index) {
    if (allPosts && allPosts.length > index) {
        SetInfo("pobieram podstawowe dane - " + (index + 1) + "/" + allPosts.length);
        var currentPost = allPosts[index];
        $.ajax({
            url: currentPost.url,
            dataType: "html",
            success: function (data) {
                data = GetHtmlWithoutLodingData(data);
                data = $(data);
				
				$.ajax({
				  type: "POST",
				  url: "https://www.dobreprogramy.pl/Providers/CommentsHandler.ashx",
				  data: "put%5Bwhat%5D=listNew&put%5Buser_id%5D="+Dp.user.id+"&put%5Bid%5D="+currentPost.id+"&put%5Bpage%5D=1",
				}).done(function(dataComm){
					dataComm = JSON.parse(dataComm).list;
					
					for(i = 0; i<dataComm.length;i++)
					{
						elem = dataComm[i];
						currentPost.commentList.push(new Comment(elem.author_name,
                        ParseDate(elem.comment_created),
                        elem.comment_upvote_count * 1,
                        !elem.author_logged_in
                    ));
					
					}
					
					currentPost.date = data.find(".content-info:first time").text();
					currentPost.realDate = ParseDate(currentPost.date);
					currentPost.name = data.find("article header h1:first").text().trim();
					currentPost.comments = currentPost.commentList.length;
					GetDataFromPost(++index);
				})
				/*
                data.find("#komentarze section").each(function (i, elem) {
                    currentPost.commentList.push(new Comment($(elem).find("header :first-child").text(),
                        ParseDate($(elem).find("header span:last").text()),
                        $(elem).find("footer span").text() * 1,
                        $(elem).find("header :first-child")[0].tagName == "SPAN"
                    ))
                })
                */
            }
        })
    }
    else {
        if (allPosts.length == 0) {
            SetInfo("Brak wpisów do analizy");
        }
        else {
            if (isYourProfile) {
                GetDataFromBlogPanel(0);
            }
            else {
                DrawData();
            }
        }


    }
}

function GetDataFromBlogPanel(index) {
    if (allPosts && allPosts.length > index) {
        SetInfo("pobieram rozszerzone dane - " + (index + 1) + "/" + allPosts.length);
        var currentPost = allPosts[index];
        currentPost.edit = "https://www.dobreprogramy.pl/Blog,Edycja," + currentPost.id + ".html";
        $.ajax({
            url: currentPost.edit,
            dataType: "html",
            success: function (data) {
                data = GetHtmlWithoutLodingData(data);
                data = $(data);
                stat = data.find(".user-info:eq(0) div:eq(2)").text();
                currentPost.status = (stat === "Opublikowano" ? 0 : (stat === "Opublikowano (na stronie głównej)" ? 1 : -1));
                currentPost.counter = parseInt(data.find(".user-info:eq(0) div:eq(7) div:eq(1)").text());
                currentPost.info = data.find("#phContentLeft_trMotive").text() != "";
				currentPost.comments = 1*data.find(".user-info:eq(0) div:eq(10) div:eq(1)").text();
                GetDataFromBlogPanel(++index);
            }
        })
    }
    else {
        DrawData();
    }
}

function DrawData() {
    SetInfo("gotowe...");
    allPosts = allPosts.sort(function (a, b) { return PostSort("comments", a, b); });
    tab = "<div class='post-sort-info section-title color-heading font-heading text-h45'>Wpisy wg " + (isYourProfile ? "liczby wyświetleń" : "liczby komentarzy") + "</div><div class='content-list XX'>";

    for (var i = 0; i < (allPosts.length < 10 ? allPosts.length : 10); i++) {
        tab += AddPostInfo(i);
    }
    tab += "</div><div class='moreMore' style='padding-top:5px;' ><a href='javascript:void(0)' class='color-heading text-bold link-color font-heading text-h7'>pokaż wszystkie</a></div>";
    $(".myPostInfo .counterX,.myInfo").remove();
    $(".myPostInfo .myPosts").append(tab);
    $(".moreMore a").click(ShowRest);

    $(".myPostInfo").prepend("<div class='filter font-heading-master'>"
        + "<div class='dropdown simple'>"
        + "<div class='text-h5 arrow'>"
        + "Sortuj wpisy wg:</div>"
        + "<ul style='display:none'>"
        + "<li " + HideIfNotYourProfile() + "><a href='javascript:void(0)' data-sort='counter' class='text-h5 color-content'>"
        + "liczby wyświetleń</a></li>"
        + "<li><a href='javascript:void(0)' data-sort='comments' class='text-h5 color-content'>"
        + "liczby komentarzy</a></li>"
        + "<li><a href='javascript:void(0)' data-sort='date' class='text-h5 color-content'>"
        + "daty publikacji</a></li>"
        + "<li " + HideIfNotYourProfile() + "><a href='javascript:void(0)' data-sort='info' class='text-h5 color-content'>"
        + "adnotacji moderacji</a></li>"
        + "</ul>"
        + "</div>"
        + "</div>")

    sumCom = 0;
    sumSee = 0;
    sumPost = 0;
    sumPostMain = 0;
    for (var i = 0; i < allPosts.length; i++) {
        sumCom += allPosts[i].comments;
        sumSee += allPosts[i].counter;
        if (allPosts[i].status >= 0)
            sumPost += 1;
        if (allPosts[i].status == 1)
            sumPostMain += 1;
    }
    if (sumPost > 0) {
        tab = "<div class='myStatsInfo content-info' style='margin:15px;'>";
        tab += "<div " + HideIfNotYourProfile() + "><label>wyświetleń - </label><span>" + sumSee.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</span><label> (średnia <label><span>"
            + (sumSee / sumPost).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</span><label>)</label></div>";
        tab += "<div><label>komentarzy - </label><span>" + sumCom.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</span><label> (średnia <label><span>"
            + (sumCom / sumPost).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</span><label>)</label></div>";
        tab += "<div><label>wpisów - </label><span>" + sumPost + "</span><label " + HideIfNotYourProfile() + "> (na głównej: <span>" + ((sumPostMain / sumPost) * 100).toFixed(0) + "%</span>)</label></div>";
        tab += "<div class='BtnCharrtsMagicOMG counterX link-color font-heading text-h7' style='text-align:center; margin:10px;' ><a  href='javascript:void(0)' class='btn'>pokaż wykresy</a></div>";
        tab += "</div>"



    }

    $(".myPostInfo").prepend(tab);
    $(".BtnCharrtsMagicOMG a").bind("click", function () { FFhack() });

    $(".myPostInfo .myStatsInfo span").addClass("color-heading text-bold");

    $('.myPostInfo .dropdown').click(function () {
        if ($(this).hasClass('active') == true) {
            $(this).removeClass('active').children('ul').hide();
        } else {
            $('.myPostInfo .dropdown').removeClass('active').children('ul').hide();
            $(this).addClass('active').children('ul').show();
        }
    });

    $("[data-sort]").click(function () { SortMyPosts(this); })
}



function SortMyPosts(par) {
    var sortName = $(par).attr("data-sort");
    allPosts = allPosts.sort(function (a, b) { return PostSort(sortName, a, b); });
    $(".post-sort-info").text("Wpisy wg " + $(par).text());

    $(".myPostInfo .content-list .XX").empty();
    countToShow = ($(".moreMore").length == 0) ? allPosts.length : (allPosts.length < 10 ? allPosts.length : 10);
    tab = "";
    for (var i = 0; i < countToShow; i++) {
        tab += AddPostInfo(i);
    }

    $(".myPostInfo .content-list .XX").append(tab);

}

function HideIfNotYourProfile() {
    return isYourProfile ? "" : "style='display:none'"
}

function AddPostInfo(i) {
    return "<div class='item-content float-left'>"
        + "<h3 class='text-h65'><a class='color heading " + (allPosts[i].info == true ? "link-color font-heading" : "") + "' target='_blank' href='" + allPosts[i].url + "'>" + allPosts[i].name + "</a></h3>"
        + "<div class='content-info'>" + allPosts[i].date + "</div>"
        + "<div class='content-info'><a href='" + allPosts[i].edit + "' class='color-heading text-bold' " + HideIfNotYourProfile() + " >" + allPosts[i].counter.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " wyświetleń</a>     "
        + "<span class='link-color' " + HideIfNotYourProfile() + ">/</span> <a href='" + allPosts[i].edit + "' class='color-heading text-bold '>" + allPosts[i].comments.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " komentarzy</a>"
        + "</div>"
        + "</div>"
        + "<div class='clear'></div><div class='border-verctical'></div>"
        ;
}

function ShowRest() {
    $(".myPostInfo .content-list .XX").empty();
    tab = "";
    for (var i = 0; i < allPosts.length; i++) {
        tab += AddPostInfo(i);
    }
    $(".myPostInfo .content-list .XX").append(tab);

    $(".moreMore").remove();
}

function SetInfo(info) {
    $(".myPostInfo .counterX").text(info);
}

function StartBlending() {
    mainColor = $("a:contains('blogi')").parent().css("background-color");
    mainColor = mainColor.substr(0, (mainColor.length - 1));
    mainColor = mainColor.replace("rgb", "rgba");
    myPosts = [];
    hrefList = []
    SetInfo("rozpoczynam pracę...");
    //GoDeeper(1);


    GetDataFromProfile(1);
}

var baseBlogUrl = $(".user-info a:first").attr("href");
function GetBaseUrl(index) {
    var sufix = ",Uzytkownik.html";
    if (baseBlogUrl.endsWith(sufix)) {
         return baseBlogUrl.replace(sufix,",Blog,"+index+".html");
    }
    else {
        return baseBlogUrl + "," + index;
    }
}


if ($(".profile-info").length == 1) {
    blogerName = $(".user-info a:first").text();
    tab = "<div style='padding-top:10px;padding-bottom:20px;' class='myPostInfo'><div class='counterX link-color font-heading text-h7' style='text-align:center' ><a href='javascript:void(0)' class='btn'>rozpocznij analizę wpisów blogera " + blogerName + "</a><div class='myInfo' style='padding-top:5px;' ><a href='http://dp.do/81509' class='color-heading text-bold'>stworzone przez: djfoxer [2.0]</a></div></div><div class='myPosts content-list'>"
        + "</div></div>";
    $("#badges").prepend(tab);

    $(".myPostInfo a:first").click(StartBlending);
    isYourProfile = $(".userMenu li:last a strong").text() === blogerName;
}
else {
    blogerName = null;
}

/*
$("#headMenu div").append('<a href="#" class="color-secondary"><i class="icon-tools"></i>licznik blogowy</a>');
$($("#headMenu a")).attr('style', 'font-size: 10px !important');*/


function GetHtmlWithoutLodingData(rawResponse) {
    var clear = rawResponse.replace(/<img[^>]*>/g, "");
    return safeResponse.cleanDomString(clear);
}


//charts
//realDate
//comments
//counter

// $("#content").prepend("<canvas id='canvas1' width='629' height='400'></canvas>")
// var ctx = document.getElementById("canvas1").getContext("2d");
// data = GetDataToChart_WeekDayToCount();
// new Chart(ctx).Bar(data);

function FFhack() {
    if (fuckSwitchShow === true)
        ShowChart();
    else
        HideChart();
}

function HideChart() {
    fuckSwitchShow = true;
    $("#content .DivCharts").remove();
    $(".BtnCharrtsMagicOMG a").text("pokaż wykresy");
}

var randomColorGenerator = function () {
    return '#' + (Math.random().toString(16) + '0000000').slice(2, 8);
};

var rgb2hex = function (red, green, blue) {
    var rgb = blue | (green << 8) | (red << 16);
    return '#' + (0x1000000 + rgb).toString(16).slice(1)
}

var rgb2hexFormat = function (text, alfa) {
    return "rgba(" + text.split(',')[0].split('(')[1] * 1 + "," + text.split(',')[1] * 1 + "," + text.split(',')[2] * 1 + "," + alfa + ")";
}


var mainHex = "";

var scales = {
    xAxes: [{
        ticks: {
            autoSkip: false,
        }
    }],
    yAxes: [{
        ticks: {
            min: 0
        }
    }]
};

var drawChart = function (title, labels, data, canvas) {


    new Chart(canvas, {
        type: 'bar',
        options: {
            title: {
                text: title
            },
            scales: scales,
        },
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: mainHex,
                borderWidth: 1
            }]
        }
    });
}

var drawChart2 = function (title, labels, data, canvas) {

    mainHex1 = rgb2hexFormat(mainColor, "0.7");
    mainHex2 = rgb2hexFormat(mainColor, "0.3");

    new Chart(canvas, {
        type: 'pie',
        options: {
            title: {
                text: title
            },
            scales: scales,
        },
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [mainHex1, mainHex2],
                borderWidth: 1
            }]
        }
    });
}

function ShowChart() {
    window.scrollTo(0, 0);
    $(".BtnCharrtsMagicOMG a").text("ukryj wykresy");
    fuckSwitchShow = false;


    //c = document.getElementById("canvas1");
    //c.width = c.width;



    allPosts = allPosts.sort(function (a, b) { return PostSort("date2", a, b); });

    tabDay = new Array();
    for (var i = 0; i < 7; i++)
        tabDay[i] = 0;

    tabDayComments = new Array();
    for (var i = 0; i < 7; i++)
        tabDayComments[i] = 0;

    tabMonth = new Array();
    for (var i = 0; i < 12; i++)
        tabMonth[i] = 0;

    year_name = new Array();
    year_count = new Array();

    tabMonthComments = new Array();
    for (var i = 0; i < 12; i++)
        tabMonthComments[i] = 0;

    year_nameComments = new Array();
    year_countComments = new Array();

    hours = new Array();
    hoursName = new Array();
    for (var i = 0; i < 4; i++) {
        hours[i] = 0;
        //hoursName[i] = ("0" + i).slice(-2);
    }

    hoursCom = new Array();
    for (var i = 0; i < 4; i++) {
        hoursCom[i] = 0;
        //hoursName[i] = ("0" + i).slice(-2);
    }

    hoursName = ["noc", "ranek", "popołudnie", "wieczór"]
    main = 0;
    other = 0;

    comUsers = {};
    comUserAno = { author: "NIEZALOGOWANY", counter: 0, likes: 0 };
    comUsersName = [];
    comUsersValue = [];

    for (var i = 0; i < allPosts.length; i++) {
        tabDay[allPosts[i].realDate.getDay()] += 1;
        tabMonth[allPosts[i].realDate.getMonth()] += 1;
        if (allPosts[i].status == 0)
            other += 1;
        if (allPosts[i].status == 1)
            main += 1;
        y = allPosts[i].realDate.getFullYear();
        j = $.inArray(y, year_name);
        if (j != -1) {
            year_count[j] += 1;
        } else {
            year_name.push(y);
            year_count[$.inArray(y, year_name)] = 1;
        }
        h = parseInt(allPosts[i].realDate.getHours());
        if (h >= 0 && h < 6)
            hours[0] += 1;
        else if (h >= 6 && h < 12)
            hours[1] += 1;
        else if (h >= 12 && h < 18)
            hours[2] += 1;
        else if (h >= 18)
            hours[3] += 1;

        if (allPosts[i].comments) {
            for (var index = 0; index < allPosts[i].commentList.length; index++) {
                currentComment = allPosts[i].commentList[index];
                h = parseInt(currentComment.date.getHours());
                if (h >= 0 && h < 6)
                    hoursCom[0] += 1;
                else if (h >= 6 && h < 12)
                    hoursCom[1] += 1;
                else if (h >= 12 && h < 18)
                    hoursCom[2] += 1;
                else if (h >= 18)
                    hoursCom[3] += 1;

                if (currentComment.ano === true) {
                    comUserAno.counter += 1;
                    comUserAno.likes += currentComment.likes;
                }
                else {
                    if (!comUsers[currentComment.author]) {
                        comUsers[currentComment.author] = { author: currentComment.author, counter: 0, likes: 0 };
                    }
                    comUsers[currentComment.author].counter += 1;
                    comUsers[currentComment.author].likes += currentComment.likes;
                }

                commDate = currentComment.date;
                tabDayComments[commDate.getDay()] += 1;
                tabMonthComments[commDate.getMonth()] += 1;

                y = commDate.getFullYear();
                j = $.inArray(y, year_nameComments);
                if (j != -1) {
                    year_countComments[j].counter += 1;
                } else {
                    year_nameComments.push(y);
                    year_countComments[$.inArray(y, year_nameComments)] = { counter: 1, year: parseInt(y) };
                }
            }


        }
    }

    year_countComments = year_countComments.sort(function (a, b) { return a.year - b.year; })
    year_nameComments = $.map(year_countComments, function (e) { return e.year });
    year_countComments = $.map(year_countComments, function (e) { return e.counter });


    comUsers = $.map(comUsers, function (o) { return o; })
    userComments = $.grep(comUsers, function (u) { return u.author == blogerName });
    if (userComments.length == 1) {
        userComments = userComments[0].counter;
    }
    else {
        userComments = 0;
    }
    comUsers = $.grep(comUsers, function (u) { return u.author != blogerName });

    comUsers = comUsers.sort(function (a, b) { return b.counter - a.counter; }).slice(0, 10);

    for (var index = 0; index < comUsers.length; index++) {
        var element = comUsers[index];
        if (element.counter > 0) {
            comUsersName.push(element.author);
            comUsersValue.push(element.counter);
        }
    }
    likes = comUsers.sort(function (a, b) { return b.likes - a.likes; }).slice(0, 10);
    likesName = []
    likesValues = [];
    for (var index = 0; index < likes.length; index++) {
        var element = comUsers[index];
        if (element.likes > 0) {
            likesName.push(element.author);
            likesValues.push(element.likes);
        }
    }

    chartMain = (main / (other + main)) * 100;

    $("#content").prepend("<div class='DivCharts'></div>");

    Chart.defaults.global.legend.display = false;
    Chart.defaults.global.title.display = true;
    mainHex = rgb2hexFormat(mainColor, "0.5");

    $("#content .DivCharts").prepend("<canvas id='canvas6' width='629' height='400'></canvas>");
    drawChart('Liczba komentarzy - godzinowo', hoursName, hoursCom, "canvas6");

    $("#content .DivCharts").prepend("<canvas id='canvas7' width='629' height='400'></canvas>");
    drawChart("Top 10 komentujących wg liczby komentarzy (twoich: " + userComments + ", niezalogowanych: " + comUserAno.counter + ")", comUsersName, comUsersValue, "canvas7");


    $("#content .DivCharts").prepend("<canvas id='canvas8' width='629' height='400'></canvas>");
    drawChart("Top 10 komentujacych wg Like'ów", likesName, likesValues, "canvas8");


    $("#content .DivCharts").prepend("<canvas id='canvas9' width='629' height='400'></canvas>");
    drawChart("Liczba komentarzy - dzień tygodnia", ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"], tabDayComments, "canvas9");

    $("#content .DivCharts").prepend("<canvas id='canvas10' width='629' height='400'></canvas>");
    drawChart("Liczba komentarzy - miesięcznie", ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
        tabMonthComments, "canvas10");

    $("#content .DivCharts").prepend("<canvas id='canvas11' width='629' height='400'></canvas>");
    drawChart("Liczba komentarzy - rocznie", year_nameComments, year_countComments, "canvas11");

    var year_countPostComments = year_countComments.slice();
    for (var index = 0; index < year_countPostComments.length; index++) {
        var ind = year_name.indexOf(year_nameComments[index]);
        if (ind >= 0 && year_countPostComments[index] > 0) {
            year_countPostComments[index] = Math.round(year_countPostComments[index] / year_count[ind])
        }
    }


    $("#content .DivCharts").prepend("<canvas id='canvas12' width='629' height='400'></canvas>");
    drawChart("Średnia liczba komentarzy na wpis rocznie", year_nameComments, year_countPostComments, "canvas12");



    $("#content .DivCharts").prepend("<canvas id='canvas4' width='629' height='400'></canvas>");
    drawChart("Liczba wpisów - godzinowo", hoursName, hours, "canvas4");


    $("#content  .DivCharts").prepend("<canvas id='canvas1' width='629' height='400'></canvas>");
    drawChart("Liczba wpisów - dzień tygodnia", ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"], tabDay, "canvas1");



    $("#content .DivCharts").prepend("<canvas id='canvas5' width='629' height='400'></canvas>");
    drawChart("Liczba wpisów - miesięcznie", ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
        tabMonth, "canvas5");


    $("#content .DivCharts").prepend("<canvas id='canvas3' width='629' height='400'></canvas>");
    drawChart("Liczba wpisów - rocznie", year_name, year_count, "canvas3");

    if (isYourProfile) {


        $("#content .DivCharts").prepend("<canvas id='canvas2' width='629' height='400'></canvas>");

        drawChart2("Liczba wpisów na głównej", ["Główna - " + main, "\"Pozostałe\" - " + other], [chartMain, 100 - chartMain], "canvas2");



    }


}

safeResponse = function () {

    var validAttrs = ["class", "id", "href", "style"];

    this.__removeInvalidAttributes = function (target) {
        var attrs = target.attributes, currentAttr;

        for (var i = attrs.length - 1; i >= 0; i--) {
            currentAttr = attrs[i].name;

            if (attrs[i].specified && validAttrs.indexOf(currentAttr) === -1) {
                target.removeAttribute(currentAttr);
            }

            if (
                currentAttr === "href" &&
                /^(#|javascript[:])/gi.test(target.getAttribute("href"))
            ) {
                target.parentNode.removeChild(target);
            }
        }
    }

    this.__cleanDomString = function (data) {
        var parser = new DOMParser;
        var tmpDom = parser.parseFromString(data, "text/html").body;

        var list, current, currentHref;

        list = tmpDom.querySelectorAll("script,img");

        for (var i = list.length - 1; i >= 0; i--) {
            current = list[i];
            current.parentNode.removeChild(current);
        }

        list = tmpDom.getElementsByTagName("*");

        for (i = list.length - 1; i >= 0; i--) {
            __removeInvalidAttributes(list[i]);
        }

        return tmpDom.innerHTML;
    }

    return {
        cleanDomString: function (html) {
            return __cleanDomString(html)
        }
    }
}();




