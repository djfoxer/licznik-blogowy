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
                allPosts.push(new Post(null, link, 0, null, false, null, null, 0, id, ""));
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

                var urlWithBloggerId = $("a[href$='Odznaki.html']").attr("href");
                var bloggerId = -1;
                if (urlWithBloggerId) {
                    bloggerId = urlWithBloggerId.split(',')[0].split('/')[3];
                }

                $.ajax({
                    type: "POST",
                    url: "https://www.dobreprogramy.pl/Providers/CommentsHandler.ashx",
                    data: "put%5Bwhat%5D=listNew&put%5Bid%5D=" + currentPost.id,
                }).done(function (dataComm) {
                    dataComm = JSON.parse(dataComm).list;

                    for (i = 0; i < dataComm.length; i++) {
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
                currentPost.comments = 1 * data.find(".user-info:eq(0) div:eq(10) div:eq(1)").text();
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
        return baseBlogUrl.replace(sufix, ",Blog," + index + ".html");
    }
    else {
        return baseBlogUrl + "," + index;
    }
}




/*
$("#headMenu div").append('<a href="#" class="color-secondary"><i class="icon-tools"></i>licznik blogowy</a>');
$($("#headMenu a")).attr('style', 'font-size: 10px !important');*/
