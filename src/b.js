function Post(name, url, counter, date, info, edit, comments, status, id) {
    this.name = name;
    this.url = url;
    this.counter = parseInt(counter);
    this.date = date;
    this.realDate = ParseDate(date);
    this.info = info;
    this.edit = edit;
    this.comments = parseInt(comments);
    this.status = status;
    this.commentList = new Array();
    this.id = id;
    this.fullUrl = "";
}

function Comment(author, date, likes) {
    this.author = author;
    this.date = date;
    this.likes = likes;
}

function PostSortdate(a, b) {
    return b.realDate - a.realDate;
}

function PostSortdate2(a, b) {
    return a.realDate - b.realDate;
}

function PostSortcounter(a, b) {
    return b.counter - a.counter;
}

function PostSortinfo(a, b) {
    return b.info - a.info;
}

function PostSortcomments(a, b) {
    return b.comments - a.comments;
}

function ParseDate(date) {
    return new Date(date.substring(6, 10), parseInt(date.substring(3, 5)) - 1, parseInt(date.substring(0, 2))
        , parseInt(date.substring(11, 13)), parseInt(date.substring(14, 16)));
}

var myPosts = [];
var hrefList = []
var mainColor = "rgb(150, 0, 0)";
var fuckSwitchShow = true;

function GoDeeper(ind) {
    SetInfo("odczytuję ilość wpisów...");
    $.ajax({
        url: 'https://www.dobreprogramy.pl/MojBlog,' + ind + '.html',
        success: function (data) {
            data = GetHtmlWithoutLodingData(data);
            posts = $(data).find("#twojewpisy .contentText  a");
            if (posts.length > 0) {
                posts.each(function () {
                    hrefList.push($(this).attr("href"));
                });
                GoDeeper(++ind);
            }
            else {
                if (hrefList.length > 0) {
                    GetDataFromHref(hrefList, 0);
                }
            }

        }
    });
}

function GetFullUrl(baseHref, index) {
    linkToSearch = baseHref + "," + index;
    $.ajax({
        url: linkToSearch,
        success: function (data) {
            data = GetHtmlWithoutLodingData(data);
            data = $(data);
            data.find("#content article > header > h1 > a").map(function () { return $(this).attr("href") }).each(function (i, link) {
                id = link.split(",")[1].split(".")[0];
                var post = $.grep(myPosts, function (e) { return e.id == id; });
                if (post.length == 1) {
                    post[0].fullUrl = link;
                }
            });

            if (data.find("a[href='" + baseHref + "," + (++index) + "']").length > 0) {
                GetFullUrl(baseHref, index);
            }
            else {
                CollectCommentsDetails(0);
            }
        }
    })
}

function CollectCommentsDetails(index) {
    if (myPosts && myPosts.length > index) {
        SetInfo("odczytano komentarzy z wpisów - " + (index + 1) + "/" + myPosts.length);
        if (myPosts[index].comments > 0) {
            $.ajax({
                url: myPosts[index].fullUrl,
                success: function (data) {
                    data = GetHtmlWithoutLodingData(data);
                    data = $(data);
                    data.find("#komentarze section").each(function (i, elem) {
                        myPosts[index].commentList.push(new Comment($(elem).find("a:first").text(),
                            ParseDate($(elem).find("header span:last").text()),
                            $(elem).find("footer span").text() * 1
                        ))
                    })
                    CollectCommentsDetails(++index)
                }
            });
        } else {
            CollectCommentsDetails(++index);
        }
    } else {
        DrawData();
    }
}

function DrawData() {
    SetInfo("gotowe...");
    tab = "<div class='post-sort-info section-title color-heading font-heading text-h45'>Wpisy wg ilości wyświetleń</div><div class='content-list XX'>";

    for (var i = 0; i < (myPosts.length < 10 ? myPosts.length : 10); i++) {
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
        + "<li><a href='javascript:void(0)' data-sort='counter' class='text-h5 color-content'>"
        + "ilości wyświetleń</a></li>"
        + "<li><a href='javascript:void(0)' data-sort='comments' class='text-h5 color-content'>"
        + "ilości komentarzy</a></li>"
        + "<li><a href='javascript:void(0)' data-sort='date' class='text-h5 color-content'>"
        + "daty publikacji</a></li>"
        + "<li><a href='javascript:void(0)' data-sort='info' class='text-h5 color-content'>"
        + "adnotacji moderacji</a></li>"
        + "</ul>"
        + "</div>"
        + "</div>")

    sumCom = 0;
    sumSee = 0;
    sumPost = 0;
    sumPostMain = 0;
    for (var i = 0; i < myPosts.length; i++) {
        sumCom += myPosts[i].comments;
        sumSee += myPosts[i].counter;
        if (myPosts[i].status >= 0)
            sumPost += 1;
        if (myPosts[i].status == 1)
            sumPostMain += 1;
    }
    if (sumPost > 0) {
        tab = "<div class='myStatsInfo content-info' style='margin:15px;'>";
        tab += "<div><label>wyświetleń - </label><span>" + sumSee.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</span><label> (średnia <label><span>"
            + (sumSee / sumPost).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</span><label>)</label></div>";
        tab += "<div><label>komentarzy - </label><span>" + sumCom.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</span><label> (średnia <label><span>"
            + (sumCom / sumPost).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</span><label>)</label></div>";
        tab += "<div><label>na głównej - </label><span>" + ((sumPostMain / sumPost) * 100).toFixed(0) + "%</span></div>";
        tab += "<div class='BtnCharrtsMagicOMG counterX link-color font-heading text-h7' style='text-align:center' ><a  href='javascript:void(0)' class='btn'>pokaż wykresy</a></div>";
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

function GetDataFromHref(hrefList, index) {
    if (hrefList.length > index) {
        $.ajax({
            url: hrefList[index],
            success: function (data) {
                data = GetHtmlWithoutLodingData(data);
                data = $(data);
                id = hrefList[index].split(",")[2].split('.')[0];
                stat = data.find(".user-info:eq(1) div:eq(2)").text();
                stat = (stat === "Opublikowano" ? 0 : (stat === "Opublikowano (na stronie głównej)" ? 1 : -1));
                var url = "http://dp.do/" + id;
                v = new Post(data.find("#phContentLeft_txtTitle").val(),
                    url,
                    data.find(".user-info:eq(1) div:eq(7) div:eq(1)").text(),
                    data.find(".user-info:eq(1) div:eq(5)").text(),
                    data.find("#phContentLeft_trMotive").text() != "",
                    hrefList[index],
                    data.find(".user-info:eq(1) div:eq(10) div:eq(1)").text(),
                    stat,
                    id
                );
                myPosts.push(v);
                SetInfo("odczytano wpisów - " + (index + 1) + "/" + hrefList.length);
                GetDataFromHref(hrefList, ++index);
            }
        });
    }
    else {
        myPosts = myPosts.sort(PostSortcounter);
        SetInfo("ładowanie...");

        var baseUrl = $(".userMenu.font-menu-master a").last()[0].href;
        GetFullUrl(baseUrl, 1);

        SetInfo("przygotowuję do pobrania komentarzy...");




    }
}



function SortMyPosts(par) {
    eval("myPosts = myPosts.sort(PostSort" + $(par).attr("data-sort") + ");");
    $(".post-sort-info").text("Wpisy wg " + $(par).text());

    $(".myPostInfo .content-list .XX").empty();
    countToShow = ($(".moreMore").length == 0) ? myPosts.length : (myPosts.length < 10 ? myPosts.length : 10);
    tab = "";
    for (var i = 0; i < countToShow; i++) {
        tab += AddPostInfo(i);
    }

    $(".myPostInfo .content-list .XX").append(tab);

}

function AddPostInfo(i) {
    return "<div class='item-content float-left'>"
        + "<h3 class='text-h65'><a class='color heading " + (myPosts[i].info == true ? "link-color font-heading" : "") + "' target='_blank' href='" + myPosts[i].url + "'>" + myPosts[i].name + "</a></h3>"
        + "<div class='content-info'>" + myPosts[i].date + "</div>"
        + "<div class='content-info'><a href='" + myPosts[i].edit + "' class='color-heading text-bold '>" + myPosts[i].counter.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " wyświetleń</a>     "
        + "<span class='link-color'>/</span> <a href='" + myPosts[i].edit + "' class='color-heading text-bold '>" + myPosts[i].comments.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " komentarzy</a>"
        + "</div>"
        + "</div>"
        + "<div class='clear'></div><div class='border-verctical'></div>"
        ;
}

function ShowRest() {
    $(".myPostInfo .content-list .XX").empty();
    tab = "";
    for (var i = 0; i < myPosts.length; i++) {
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
    GoDeeper(1);
}


if ($(".profile-info").length == 1
    && $(".userMenu li:last a").attr("href").toLowerCase() == $(".user-info a:eq(0)").attr("href").toLowerCase()) {
    //$(".myPostInfo").remove();
    tab = "<div style='padding-top:10px;' class='myPostInfo'><div class='counterX link-color font-heading text-h7' style='text-align:center' ><a href='javascript:void(0)' class='btn'>rozpocznij analizę wpisów na blogu</a><div class='myInfo' style='padding-top:5px;' ><a href='http://dp.do/81509' class='color-heading text-bold'>stworzone przez: djfoxer [1.0]</a></div></div><div class='myPosts content-list'>"
        + "</div></div>";
    $(".search:eq(0)").append(tab);

    $(".myPostInfo a:first").click(StartBlending);
}


function GetHtmlWithoutLodingData(rawResponse) {
    return rawResponse.replace(/<img[^>]*>/g, "");

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



function ShowChart() {
    window.scrollTo(0, 0);
    $(".BtnCharrtsMagicOMG a").text("ukryj wykresy");
    fuckSwitchShow = false;


    //c = document.getElementById("canvas1");
    //c.width = c.width;



    myPosts = myPosts.sort(PostSortdate2);

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
    comUsersName = [];
    comUsersValue = [];

    for (var i = 0; i < myPosts.length; i++) {
        tabDay[myPosts[i].realDate.getDay()] += 1;
        tabMonth[myPosts[i].realDate.getMonth()] += 1;
        if (myPosts[i].status == 0)
            other += 1;
        if (myPosts[i].status == 1)
            main += 1;
        y = myPosts[i].realDate.getFullYear();
        j = $.inArray(y, year_name);
        if (j != -1) {
            year_count[j] += 1;
        } else {
            year_name.push(y);
            year_count[$.inArray(y, year_name)] = 1;
        }
        h = parseInt(myPosts[i].realDate.getHours());
        if (h >= 0 && h < 6)
            hours[0] += 1;
        else if (h >= 6 && h < 12)
            hours[1] += 1;
        else if (h >= 12 && h < 18)
            hours[2] += 1;
        else if (h >= 18)
            hours[3] += 1;

        if (myPosts[i].comments) {
            for (var index = 0; index < myPosts[i].commentList.length; index++) {
                h = parseInt(myPosts[i].commentList[index].date.getHours());
                if (h >= 0 && h < 6)
                    hoursCom[0] += 1;
                else if (h >= 6 && h < 12)
                    hoursCom[1] += 1;
                else if (h >= 12 && h < 18)
                    hoursCom[2] += 1;
                else if (h >= 18)
                    hoursCom[3] += 1;

                if (!comUsers[myPosts[i].commentList[index].author]) {
                    comUsers[myPosts[i].commentList[index].author] = { author: myPosts[i].commentList[index].author, counter: 0, likes: 0 };
                }
                comUsers[myPosts[i].commentList[index].author].counter += 1;
                comUsers[myPosts[i].commentList[index].author].likes += myPosts[i].commentList[index].likes;
                commDate = myPosts[i].commentList[index].date;
                tabDayComments[commDate.getDay()] += 1;
                tabMonthComments[commDate.getMonth()] += 1;

                y = commDate.getFullYear();
                j = $.inArray(y, year_nameComments);
                if (j != -1) {
                    year_countComments[j] += 1;
                } else {
                    year_nameComments.push(y);
                    year_countComments[$.inArray(y, year_nameComments)] = 1;
                }
            }


        }
    }
    userName = $(".userMenu li:last strong").text();

    comUsers = $.map(comUsers, function (o) { return o; })
    userComments = $.grep(comUsers, function (u) { return u.author == userName });
    if (userComments.length == 1) {
        userComments = userComments[0].counter;
    }
    else {
        userComments = 0;
    }
    comUsers = $.grep(comUsers, function (u) { return u.author != userName });

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

    chartMain = (main / (other + main)) * 100
    $("#content").prepend("<div class='DivCharts'></div>");


    $("#content .DivCharts").prepend("<canvas id='canvas6' width='629' height='400'></canvas>");



    var chart4 = new AwesomeChart('canvas6');
    chart4.title = "Ilość komentarzy - godzinowo";
    chart4.data = hoursCom;
    chart4.chartType = 'default';
    chart4.randomColors = true;
    chart4.animate = true;
    chart4.randomColors = true;
    chart4.animationFrames = 60;
    chart4.labels = hoursName;
    chart4.draw();

    $("#content .DivCharts").prepend("<canvas id='canvas7' width='629' height='400'></canvas>");



    var chart2 = new AwesomeChart('canvas7');
    chart2.title = "Top 10 komentujących wg ilośc komentarzy (twoich komentarzy: " + userComments + ")";
    chart2.data = comUsersValue;
    chart2.chartType = 'default';
    chart2.randomColors = true;
    chart2.animate = true;
    chart2.randomColors = true;
    chart2.animationFrames = 60;
    chart2.labels = comUsersName;
    chart2.draw();

    $("#content .DivCharts").prepend("<canvas id='canvas8' width='629' height='400'></canvas>");
    var chart2 = new AwesomeChart('canvas8');
    chart2.title = "Top 10 komentujacych wg Like'ów";
    chart2.data = likesValues;
    chart2.chartType = 'default';
    chart2.randomColors = true;
    chart2.animate = true;
    chart2.randomColors = true;
    chart2.animationFrames = 60;
    chart2.labels = likesName;
    chart2.draw();


    $("#content .DivCharts").prepend("<canvas id='canvas9' width='629' height='400'></canvas>");
    var chart2 = new AwesomeChart('canvas9');
    chart2.title = "Ilość komentarzy - dzień tygodnia";
    chart2.data = tabDayComments;
    chart2.chartType = 'default';
    chart2.randomColors = true;
    chart2.animate = true;
    chart2.randomColors = true;
    chart2.animationFrames = 60;
    chart2.labels = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];;
    chart2.draw();




    $("#content .DivCharts").prepend("<canvas id='canvas10' width='629' height='400'></canvas>");
    var chart5 = new AwesomeChart('canvas10');
    chart5.title = "Ilość komentarzy - miesięcznie";
    chart5.data = tabMonthComments;
    chart5.chartType = 'default';
    chart5.randomColors = true;
    chart5.animate = true;
    chart5.randomColors = true;
    chart5.animationFrames = 60;
    chart5.labels = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    chart5.draw();

    $("#content .DivCharts").prepend("<canvas id='canvas11' width='629' height='400'></canvas>");

    var chart3 = new AwesomeChart('canvas11');
    chart3.title = "Ilość komentarzy - rocznie";
    chart3.data = year_countComments;
    chart3.chartType = 'default';
    chart3.randomColors = true;
    chart3.animate = true;
    chart3.randomColors = true;
    chart3.animationFrames = 60;
    chart3.labels = year_nameComments;
    chart3.draw();

    var year_countPostComments = year_countComments.slice();
    for (var index = 0; index < year_countPostComments.length; index++) {
        var ind = year_name.indexOf(year_nameComments[index]);
        if (ind >= 0 && year_countPostComments[index] > 0) {
            year_countPostComments[index] = Math.round(year_countPostComments[index] / year_count[ind])
        }
    }


    $("#content .DivCharts").prepend("<canvas id='canvas12' width='629' height='400'></canvas>");

    var chart3 = new AwesomeChart('canvas12');
    chart3.title = "Średnia ilość komentarzy na wpis rocznie";
    chart3.data = year_countPostComments;
    chart3.chartType = 'default';
    chart3.randomColors = true;
    chart3.animate = true;
    chart3.randomColors = true;
    chart3.animationFrames = 60;
    chart3.labels = year_nameComments;
    chart3.draw();


    $("#content .DivCharts").prepend("<canvas id='canvas4' width='629' height='400'></canvas>");



    var chart4 = new AwesomeChart('canvas4');
    chart4.title = "Ilość wpisów - godzinowo";
    chart4.data = hours;
    chart4.chartType = 'default';
    chart4.randomColors = true;
    chart4.animate = true;
    chart4.randomColors = true;
    chart4.animationFrames = 60;
    chart4.labels = hoursName;
    chart4.draw();

    $("#content  .DivCharts").prepend("<canvas id='canvas1' width='629' height='400'></canvas>");
    var chart1 = new AwesomeChart('canvas1');
    chart1.title = "Ilość wpisów - dzień tygodnia";
    chart1.data = tabDay;
    chart1.chartType = 'default';
    chart1.randomColors = true;
    chart1.animate = true;
    chart1.randomColors = true;
    chart1.animationFrames = 60;
    chart1.labels = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
    chart1.draw();


    $("#content .DivCharts").prepend("<canvas id='canvas5' width='629' height='400'></canvas>");
    var chart5 = new AwesomeChart('canvas5');
    chart5.title = "Ilość wpisów - miesięcznie";
    chart5.data = tabMonth;
    chart5.chartType = 'default';
    chart5.randomColors = true;
    chart5.animate = true;
    chart5.randomColors = true;
    chart5.animationFrames = 60;
    chart5.labels = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
    chart5.draw();

    $("#content .DivCharts").prepend("<canvas id='canvas3' width='629' height='400'></canvas>");

    var chart3 = new AwesomeChart('canvas3');
    chart3.title = "Ilość wpisów - rocznie";
    chart3.data = year_count;
    chart3.chartType = 'default';
    chart3.randomColors = true;
    chart3.animate = true;
    chart3.randomColors = true;
    chart3.animationFrames = 60;
    chart3.labels = year_name;
    chart3.draw();



    $("#content .DivCharts").prepend("<canvas id='canvas2' width='629' height='400'></canvas>");



    var chart2 = new AwesomeChart('canvas2');
    chart2.title = "Ilość wpisów na głównej";
    chart2.data = [chartMain, 100 - chartMain];
    chart2.chartType = 'exploded pie';
    chart2.randomColors = true;
    chart2.animate = true;
    chart2.randomColors = true;
    chart2.animationFrames = 60;
    chart2.labels = ["Główna", "\"Pozostałe\""];
    chart2.draw();





}




