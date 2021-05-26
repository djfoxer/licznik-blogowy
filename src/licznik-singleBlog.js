async function CreateSingleBlogStatButton() {
    blogerName = GetBlogerName();
    //$("img[alt='" + blogerName + "']").length >= 1 && $("a[href='/@" + blogerName + "']:contains('" + blogerName + "')").length >= 1;
    isYourProfile = false;

    let mainDiv = document.createElement("div");
    mainDiv.className = "myPostInfo " + GetStyleSpan();

    let linkDiv = document.createElement("div");
    linkDiv.className = "myInfo";
    linkDiv.appendChild(CreatePluginLink(pluginPage, pluginVersion));

    let infoDiv = document.createElement("div");
    infoDiv.className = "counterX";
    infoDiv.appendChild(await CreateButton("rozpocznij analizę wpisów blogera " + blogerName, "blendBlog"));
    infoDiv.appendChild(linkDiv);

    let myPostsDiv = document.createElement("div");
    myPostsDiv.className = "myPosts";

    mainDiv.appendChild(infoDiv);
    mainDiv.appendChild(myPostsDiv);

    let topDiv = document.createElement("div");
    topDiv.appendChild(mainDiv);
    return topDiv;
}

function GetBlogerName() {
    let currentUrl = $(location).attr('href');
    if (currentUrl.startsWith("https://www.dobreprogramy.pl/@")) {
        return currentUrl.replace("https://www.dobreprogramy.pl/@", "");
    } else {
        return null;
    }
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

function GetDataFromProfile(linkToSearch) {
    $.ajax({
        url: linkToSearch,
        dataType: "json",
        success: function (data) {
            SetInfo("pobieram podstawowe dane ze strony...");
            data.results.forEach(elem => {
                allPosts.push(CreatePost(elem));
            });

            if (data.next) {
                GetDataFromProfile(FixHttpsUrl(data.next));
            }
            else {
                GetDataFromPost(0);
            }
        }
    })
}


function GetDataFromPost(index) {
    if (allPosts && allPosts.length > index) {
        var currentPost = allPosts[index];
        GetComments(currentPost, null, index);
    }
    else {
        if (allPosts.length == 0) {
            SetInfo("Brak wpisów do analizy");
        }
        else {
            DrawData();
        }
    }
}

function GetComments(currentPost, endCursor, index) {
    var payload =
    {
        "operationName": "getComments",
        "variables":
        {
            "productId": "6504404458915457",
            "contentId": currentPost.id + "",
            "first": 50,
            "sort":
                "LATEST",
            "parentId": null,
            "after": endCursor
        },
        "query":
            "query getComments($productId: String!, $first: Int!, $contentId: String!, $sort: CommentsSortType!, $after: String, $parentId: String) {\n  comments(productId: $productId, first: $first, sort: $sort, contentId: $contentId, after: $after, parentId: $parentId) {\n    edges {\n      node {\n        id\n        created\n        nick\n        votesUp\n        votesDown\n        replies\n        user {\n          id\n          avatar\n          username\n          label\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n      __typename\n    }\n    __typename\n  }\n}\n"
    };
    $.ajax({
        type: "POST",
        dataType: "json",
        contentType: 'application/json; charset=utf-8',
        url: "https://www.dobreprogramy.pl/graphql",
        data: JSON.stringify(payload)
    }).done(function (dataComm) {
        dataComm = dataComm.data.comments;
        for (i = 0; i < dataComm.edges.length; i++) {
            elem = dataComm.edges[i].node;
            currentPost.commentList.push(new Comment(elem.nick,
                new Date(elem.created * 1000),
                elem.votesUp,
                elem.votesDown,
                elem.user == null
            ));
        }
        if (dataComm.pageInfo.hasNextPage) {
            GetComments(currentPost, dataComm.pageInfo.endCursor, index);
        }
        else {
            GetDataFromPost(++index);
        }
    })
}

function GetSortInfoAtStart() {
    return (isYourProfile ? "liczby wyświetleń" : "liczby komentarzy");
}

function DrawData() {
    SetInfo("gotowe...");
    allPosts = allPosts.sort(function (a, b) { return PostSort("comments", a, b); });

    let sortComments = cdom
        .get("label")
        .css("myPostInfo-sort-item-comment")
        .css("selected")
        .innerHTML("liczby komentarzy")
        .attribute("data-sort", "comments");

    let sortDate = cdom
        .get("label")
        .css("myPostInfo-sort-item-date")
        .innerHTML("daty publikacji")
        .attribute("data-sort", "date");

    let sortLimiter = cdom
        .get("label")
        .innerHTML(" | ");

    let sortDiv = cdom
        .get("div")
        .css("myPostInfo-sort")
        .append(cdom
            .get("div")
            .css("myPostInfo-sort-label")
            .innerHTML("sortuj wpisy wg: ")
        )
        .append(sortComments)
        .append(sortLimiter)
        .append(sortDate);

    let topContainer = document.createElement("div");
    topContainer.className = "post-sort-info";
    topContainer.appendChild(sortDiv.element);

    let contentList = document.createElement("div");
    contentList.className = "content-list XX";
    contentList.id = "myPostInfo-content-list";

    for (var i = 0; i < (allPosts.length < 10 ? allPosts.length : 10); i++) {
        contentList.appendChild(AddPostInfo(i));
    }
    topContainer.appendChild(contentList);

    let moreButton = document.createElement("div");
    moreButton.className = "moreMore";

    let moreHref = document.createElement("a");
    moreHref.innerHTML = "pokaż wszystkie";
    moreHref.href = "javascript:void(0)";
    moreHref.onclick = ShowRest;
    moreButton.appendChild(moreHref);

    let mainDiv = document.createElement("div");
    mainDiv.appendChild(topContainer);
    mainDiv.appendChild(moreButton);


    $(".myPostInfo .counterX,.myInfo").remove();
    $(".myPostInfo .myPosts").append(mainDiv);


    sumCom = 0;
    sumSee = 0;
    sumPost = 0;
    sumPostMain = 0;
    sumPostPortalMain = 0;
    for (var i = 0; i < allPosts.length; i++) {
        sumCom += allPosts[i].comments;
        sumSee += allPosts[i].counter;
        if (allPosts[i].status >= 0)
            sumPost += 1;
        if (allPosts[i].isOnMainBlog())
            sumPostMain += 1;
        if (allPosts[i].isOnMainPortal())
            sumPostPortalMain += 1;
    }
    if (sumPost > 0) {

        let myStatsInfo = document.createElement("div");
        myStatsInfo.className = "myStatsInfo";

        let commentsDiv = document.createElement("div");
        commentsDiv.classList = "myStatsInfo-comments";

        let commnetsLabel = document.createElement("label")
        commnetsLabel.innerHTML = "komentarzy - ";
        commentsDiv.appendChild(commnetsLabel);

        let commentsCount = document.createElement("span");
        commentsCount.innerHTML = "<b>" + sumCom.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</b>";
        commentsDiv.appendChild(commentsCount);

        let commnetsAvgLabel = document.createElement("label")
        commnetsAvgLabel.innerHTML = " (średnia: <b>" + (sumCom / sumPost).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</b>)";
        commentsDiv.appendChild(commnetsAvgLabel);

        myStatsInfo.appendChild(commentsDiv);

        let postsDiv = document.createElement("div");
        postsDiv.classList = "myStatsInfo-posts";

        let postsLabel = document.createElement("label")
        postsLabel.innerHTML = "wpisów - ";
        postsDiv.appendChild(postsLabel);

        let postsCount = document.createElement("span");
        postsCount.innerHTML = "<b>" + sumPost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</b>";
        postsDiv.appendChild(postsCount);

        let postsAvgLabel = document.createElement("label")
        postsAvgLabel.innerHTML = " (promowanie: <b>" + ((sumPostMain / sumPost) * 100).toFixed(0) + "%</b> blog, <b>" + ((sumPostPortalMain / sumPost) * 100).toFixed(0) + "%</b> portal)";
        postsDiv.appendChild(postsAvgLabel);

        myStatsInfo.appendChild(postsDiv);

        let showCharts = cdom.get("div").css("licznik-toggleOpenCharts")
            .append(cdom
                .get("a")
                .css("licznik-toggleOpenChartsHref")
                .innerHTML("pokaż wykresy")
                .attribute("href", "javascript:void(0)"));
        myStatsInfo.appendChild(showCharts.element);

        $(".myPostInfo").prepend(myStatsInfo);
    }


    $(".licznik-toggleOpenCharts a").bind("click", function () { FFhack() });

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
    let isSelected = $(par).hasClass("selected");
    $(".myPostInfo-sort label").removeClass("selected");
    $(par).addClass("selected");
    allPosts = allPosts.sort(function (a, b) {
        return isSelected ? PostSort(sortName, b, a) : PostSort(sortName, a, b);
    });
    RenderPosts();
}

function RenderPosts() {
    $(".myPostInfo .content-list .XX").empty();
    countToShow = ($(".moreMore").length == 0) ? allPosts.length : (allPosts.length < 10 ? allPosts.length : 10);

    var contentList = cdom.getById("myPostInfo-content-list");
    if (contentList.element) {
        contentList.element.innerHTML = "";
        for (var i = 0; i < countToShow; i++) {
            contentList.element.appendChild(AddPostInfo(i));
        }
    }
}

function HideIfNotYourProfile() {
    return isYourProfile ? "" : "style='display:none'"
}

function AddPostInfo(i) {
    let itemDev = document.createElement("div");
    itemDev.className = "post-item";

    let itemTitle = document.createElement("div");

    let itemLink = document.createElement("a");
    itemLink.className = "post-item-link " + (allPosts[i].info == true ? "post-item-link-info" : "");
    itemLink.target = "_blank";
    itemLink.href = allPosts[i].url;
    itemLink.innerHTML = allPosts[i].name;
    itemTitle.appendChild(itemLink);
    itemDev.appendChild(itemTitle);

    let itemDate = document.createElement("div");
    itemDate.className = "post-item-date";
    itemDate.innerHTML = allPosts[i].date.toLocaleString("pl");
    itemDev.appendChild(itemDate);

    /*
    let itemCount = document.createElement("span");
    itemCount.className = "post-item-count";
    itemCount.innerHTML = allPosts[i].counter.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " wyświetleń";
    itemDev.appendChild(itemCount);*/

    let itemDetails_comments = document.createElement("span");
    itemDetails_comments.innerHTML = "komentarze: " + allPosts[i].comments.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    let itemDetails_MainStatus = document.createElement("span");
    itemDetails_MainStatus.innerHTML = "• promowanie: " + (!allPosts[i].isOnMainBlog() ? "-" : "blog" + (allPosts[i].isOnMainPortal() ? ", portal" : ""));

    let itemDetails = document.createElement("div");
    itemDetails.className = "post-item-details " + $("span:contains('komentarz'):first").parent().parent().attr("class");
    itemDetails.appendChild(itemDetails_comments);
    itemDetails.appendChild(itemDetails_MainStatus);
    itemDev.appendChild(itemDetails);

    return itemDev;
}

function ShowRest() {
    $(".moreMore").remove();
    RenderPosts();
}

function SetInfo(info) {
    $(".myPostInfo .counterX").html("<a style='cursor:wait !important' class='infoText'>" + info + "</a>");
}

function StartBlending() {
    mainColor =  $("header").css("border-top-color");
    myPosts = [];
    hrefList = []
    SetInfo("rozpoczynam pracę...");

    $.ajax({
        type: "GET",
        dataType: "json",
        url: "https://www.dobreprogramy.pl/api/users/nick/" + blogerName + "/",
    }).done(function (data) {
        GetDataFromProfile(GetBaseUrl(0, data.id));
    });
}

function GetBaseUrl(index, userId) {
    let baseBlogUrl = "https://www.dobreprogramy.pl/api/blogs/?pub_state=1&ordering=-published_on&limit=10&site_dobreprogramy__gte=2&created_by="
        + userId + "&offset="
    return baseBlogUrl + index;
}
