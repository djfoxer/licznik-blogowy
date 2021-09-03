async function CreateSingleBlogStatButton() {
    blogerName = GetBlogerName();
    //$("img[alt='" + blogerName + "']").length >= 1 && $("a[href='/@" + blogerName + "']:contains('" + blogerName + "')").length >= 1;
    isYourProfile = false;

    let mainDiv = cdom.get("div").class("licznik-singleBlogInfo " + GetStyleSpan());

    let items = cdom
        .get("div")
        .class("licznik-singleStartCountingDiv")
        .append(await CreateButton("± rozpocznij analizę wpisów " + blogerName, "blendBlog"));

    if ($("img[alt='" + blogerName + "']").length >= 1 && $("a[href='/@" + blogerName + "']:contains('" + blogerName + "')").length >= 1) {
        items
            .append(cdom.get("div").attribute("style", "padding:10px"))
            .append(await CreateButton("↓ rozpocznij backup wpisów " + blogerName, "backupBlog"));
    }

    items.append(cdom.get("div")
        .class("licznik-singleInfoDiv")
        .append(CreatePluginLink(pluginPage, pluginVersion))
    );

    mainDiv.append(items);

    mainDiv.append(cdom
        .get("div")
        .class("myPosts"));

    return cdom.get("div").append(mainDiv).element;
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

function GetDataFromProfile(linkToSearch, currenCount, blogCount) {
    $.ajax({
        url: linkToSearch,
        dataType: "json",
        success: function (data) {
            data.results.forEach(elem => {
                allPosts.push(CreatePost(elem));
                SetInfo("pobieram podstawowe dane do wpisów " + (currenCount++) + "/" + blogCount + "...");
            });

            if (data.next) {
                GetDataFromProfile(FixHttpsUrl(data.next), currenCount, blogCount);
            }
            else {
                GetDataFromPost(0, blogCount);
            }
        }
    })
}


function GetDataFromPost(index, blogCount) {
    if (allPosts && allPosts.length > index) {
        var currentPost = allPosts[index];
        SetInfo("pobieram komentarze do wpisów " + (index + 1) + "/" + blogCount + "...");
        GetComments(currentPost, null, index, blogCount);
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

function GetComments(currentPost, endCursor, index, blogCount) {
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
            GetComments(currentPost, dataComm.pageInfo.endCursor, index, blogCount);
        }
        else {
            GetDataFromPost(++index, blogCount);
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
        .css("licznik-singleBlogInfo-sort-item-comment")
        .css("selected")
        .innerHTML("liczby komentarzy")
        .attribute("data-sort", "comments");

    let sortDate = cdom
        .get("label")
        .css("licznik-singleBlogInfo-sort-item-date")
        .innerHTML("daty publikacji")
        .attribute("data-sort", "date");

    let sortLimiter = cdom
        .get("label")
        .innerHTML(" | ");

    let sortDiv = cdom
        .get("div")
        .css("licznik-singleBlogInfo-sort")
        .append(cdom
            .get("div")
            .css("licznik-singleBlogInfo-sort-label")
            .innerHTML("sortuj wpisy wg: ")
        )
        .append(sortComments)
        .append(sortLimiter)
        .append(sortDate);

    let topContainer = cdom.get("div").class("post-sort-info")
        .append(sortDiv);

    let contentList = cdom.get("div")
        .class("content-list licznik-contentDiv")
        .attribute("id", "licznik-singleBlogInfo-content-list");

    for (var i = 0; i < (allPosts.length < 10 ? allPosts.length : 10); i++) {
        contentList.append(AddPostInfo(i));
    }
    topContainer.append(contentList);

    let moreButton = cdom.get("div").class("moreMore");

    let moreHref = cdom.get("a")
        .innerHTML("pokaż wszystkie")
        .attribute("href", "javascript:void(0)")
    moreHref.element.onclick = ShowRest;
    moreButton.append(moreHref);

    let mainDiv = cdom.get("div")
        .append(topContainer)
        .append(moreButton);

    $(".licznik-singleBlogInfo .licznik-singleStartCountingDiv,.licznik-singleInfoDiv").remove();
    $(".licznik-singleBlogInfo .myPosts").append(mainDiv.element);


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

        let myStatsInfo = cdom.get("div").class("licznik-singleBlogStatsInfo");

        let commentsDiv = cdom.get("div").class("licznik-singleBlogStatsInfo-comments");

        commentsDiv.append(cdom.get("label").innerHTML("komentarzy - "));
        commentsDiv.append(cdom.get("span").innerHTML("<b>" + sumCom.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</b>"));
        commentsDiv.append(cdom.get("label").innerHTML(" (średnia: <b>" + (sumCom / sumPost).toFixed(0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</b>)"));
        myStatsInfo.append(commentsDiv);

        let postsDiv = cdom.get("div").class("licznik-singleBlogStatsInfo-posts");

        postsDiv.append(cdom.get("label").innerHTML("wpisów - "));
        postsDiv.append(cdom.get("span").innerHTML("<b>" + sumPost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "</b>"));
        postsDiv.append(cdom.get("label").innerHTML(" (promowanie: <b>" + ((sumPostMain / sumPost) * 100).toFixed(0) + "%</b> blog, <b>" + ((sumPostPortalMain / sumPost) * 100).toFixed(0) + "%</b> portal)"));

        myStatsInfo.append(postsDiv);

        let showCharts = cdom.get("div").css("licznik-toggleOpenCharts")
            .append(cdom
                .get("a")
                .css("licznik-toggleOpenChartsHref")
                .innerHTML("pokaż wykresy")
                .attribute("href", "javascript:void(0)"));
        myStatsInfo.append(showCharts);

        $(".licznik-singleBlogInfo").prepend(myStatsInfo.element);
    }


    $(".licznik-toggleOpenCharts a").bind("click", function () { FFhack() });

    $("[data-sort]").click(function () { SortMyPosts(this); })
}

function SortMyPosts(par) {
    var sortName = $(par).attr("data-sort");
    let isSelected = $(par).hasClass("selected");
    $(".licznik-singleBlogInfo-sort label").removeClass("selected");
    $(par).addClass("selected");
    allPosts = allPosts.sort(function (a, b) {
        return isSelected ? PostSort(sortName, b, a) : PostSort(sortName, a, b);
    });
    RenderPosts();
}

function RenderPosts() {
    $(".licznik-singleBlogInfo .content-list .licznik-contentDiv").empty();
    countToShow = ($(".moreMore").length == 0) ? allPosts.length : (allPosts.length < 10 ? allPosts.length : 10);

    var contentList = cdom.getById("licznik-singleBlogInfo-content-list");
    if (contentList.element) {
        contentList.innerHTML("");
        for (var i = 0; i < countToShow; i++) {
            contentList.append(AddPostInfo(i));
        }
    }
}

function HideIfNotYourProfile() {
    return isYourProfile ? "" : "style='display:none'"
}

function AddPostInfo(i) {
    let itemDev = cdom.get("div").class("post-item");
    let itemTitle = cdom.get("div");

    let itemLink = cdom.get("a").class("post-item-link " + (allPosts[i].info == true ? "post-item-link-info" : ""))
        .attribute("target", "_blank")
        .attribute("href", allPosts[i].url)
        .innerHTML(allPosts[i].name);
    itemTitle.append(itemLink);
    itemDev.append(itemTitle);
    itemDev.append(cdom.get("div").class("post-item-date").innerHTML(allPosts[i].date.toLocaleString("pl")));

    let itemDetails_comments = cdom.get("span").innerHTML("komentarze: " + allPosts[i].comments.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "));
    let itemDetails_MainStatus = cdom.get("span").innerHTML("• promowanie: " + (!allPosts[i].isOnMainBlog() ? "-" : "blog" + (allPosts[i].isOnMainPortal() ? ", portal" : "")));

    let itemDetails = cdom.get("div").class("post-item-details " + $("span:contains('komentarz'):first").parent().parent().attr("class"));
    itemDetails.append(itemDetails_comments);
    itemDetails.append(itemDetails_MainStatus);
    itemDev.append(itemDetails);

    return itemDev;
}

function ShowRest() {
    $(".moreMore").remove();
    RenderPosts();
}

function SetInfo(info) {
    $(".licznik-singleBlogInfo .licznik-singleStartCountingDiv").html(
        cdom.get("a").class("infoText").attribute("style", "cursor:wait !important")
            .innerHTML(info).element
    );
}

function StartBlending() {
    mainColor = $("header").css("border-top-color");
    myPosts = [];
    hrefList = []
    SetInfo("rozpoczynam pracę...");

    $.ajax({
        type: "GET",
        dataType: "json",
        url: "https://www.dobreprogramy.pl/api/users/nick/" + blogerName + "/",
    }).done(function (data) {
        GetDataFromProfile(GetBaseUrl(0, data.id), 0, data.blogs_count);
    });
}

function GetBaseUrl(index, userId) {
    let baseBlogUrl = "https://www.dobreprogramy.pl/api/blogs/?pub_state=1&ordering=-published_on&limit=10&site_dobreprogramy__gte=2&created_by="
        + userId + "&offset="
    return baseBlogUrl + index;
}
