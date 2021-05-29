async function CreateMainBlogStatButton() {
    let month = new Date().getMonth() + 1;
    let maxDate = new Date(new Date().setMonth(month));
    let maxMonth = maxDate.getMonth() + 1;
    month = month > 9 ? month : "0" + month
    maxMonth = maxMonth > 9 ? maxMonth : "0" + maxMonth

    let topContainer = cdom.get("div");

    let welcomeContainer = cdom.get("div").class("licznik-allBlogsContainer");

    let monthInput = cdom
        .get("input")
        .attribute("type", "month")
        .class(GetStyleLabel())
        .attribute("id", "licznik-selectMonth")
        .attribute("name", "licznik-selectMonth")
        .attribute("max", maxDate.getFullYear() + "-" + maxMonth)
        .attribute("value", new Date().getFullYear() + "-" + month);

    let monthDiv = cdom.get("div").class("licznik-monthDiv");
    monthDiv.append(monthInput);

    let linkDiv = cdom.get("div").class("licznik-statusInfoAllBlogs")
    linkDiv.append(CreatePluginLink(pluginPage, pluginVersion));

    welcomeContainer
        .append(monthDiv)
        .append(await CreateButton("rozpocznij analizę wpisów z danego okresu", "blendingButton"))
        .append(linkDiv)
        .append(cdom.get("div").class("allBlogsListContent"))

    topContainer.append(welcomeContainer);

    let infoContainer = cdom.get("div").class("licznik-allInfoContainer");
    infoContainer.append(cdom.get("a").class("licznik-allBlogsInfoText"));

    let mainContainer = cdom.get("div").class("licznik-allBlogInfo");
    mainContainer.append(topContainer);
    mainContainer.append(infoContainer);

    return mainContainer.element;
}

function SetAllInfo(text) {
    if (text) {
        $(".licznik-allBlogsContainer").hide();
        $(".licznik-allBlogsInfoText").show();
        $(".licznik-allBlogsInfoText").text(text);
    }
    else {
        $(".licznik-allBlogsContainer").show();
        $(".licznik-allBlogsInfoText").hide();
    }
}

function ClearData() {
    allPosts = [];
    myPosts = [];
    hrefList = [];
    $("#licznik-allBlogPostsTable, .dataTables_wrapper").remove();
}


function StartBlendingAllBlogs() {
    ClearData();
    var montToCheck = $("#licznik-selectMonth").val();
    if (montToCheck) {
        var montToCheckAll = montToCheck.split('-');
        var firstDay = new Date(montToCheckAll[0], montToCheckAll[1] - 1, 1);
        var lastDay = new Date(montToCheckAll[0], montToCheckAll[1], 0);
        lastDay.setHours(23, 59, 59, 999);
        GetBlogPage(montToCheckAll, firstDay, 0, "https://www.dobreprogramy.pl/api/blogs/?limit=20&ordering=-published_on&pub_state=1&site_dobreprogramy__gte=3");
        SetAllInfo("wyszukuję wpisów, czekaj...");
    }
}

function GetBlogPage(montToCheckAll, firstDay, page, urlToCheck) {
    if (!urlToCheck) {
        return;
    }
    $.ajax({
        url: FixHttpsUrl(urlToCheck),
        dataType: "json",
        success: function (data) {

            SetAllInfo("wyszukuję wpisów, przeglądanie strony " + (page + 1) + "...");

            data.results.forEach(elem => {
                var postDate = new Date(elem.published_on);
                if (postDate && postDate.getFullYear() == montToCheckAll[0] && (postDate.getMonth() + 1) == montToCheckAll[1]) {
                    allPosts.push(CreatePost(elem));
                }
            });

            if (new Date(data.results[data.results.length - 1].published_on) <= firstDay) {
                RenderAllBlogTable(allPosts);
            }
            else {
                GetBlogPage(montToCheckAll, firstDay, ++page, data.next);
            }
        }
    })

}

class SumBlog {
    constructor(author, blogSum, blogPortalSum, comments, maxCommentBlog) {
        this.author = author;
        this.blogSum = blogSum;
        this.blogPortalSum = blogPortalSum;
        this.comments = comments;
        this.blogSumAllPercent = 0;
        this.commentsSumAllPercent = 0;
        this.commentsSumAvg = 0;
        this.maxCommentBlog = maxCommentBlog;
    }
}

function CreateAllBlogPostsTable() {
    let table = cdom.get("table")
    .attribute("id","licznik-allBlogPostsTable")
    .class(GetStyleLabel());

    let thead = cdom.get("thead");
    thead.append(CreateTh("Autor"));
    thead.append(CreateTh("Wpisy blog"));
    thead.append(CreateTh("Wpisy portal"));
    thead.append(CreateTh("Udział wpisów"));
    thead.append(CreateTh("Kom."));
    thead.append(CreateTh("Udział kom."));
    thead.append(CreateTh("Średnia kom."));
    thead.append(CreateTh("Najwięcej kom. pod wpisem"));

    table.append(thead);
    table.append(cdom.get("tbody"));

    return table.element;
}

function CreateTh(text) {
    return cdom.get("th").innerHTML(text);
}

function RenderAllBlogTable(allPosts) {
    SetAllInfo("jeszcze chwilka...");
    var toRenderGrouped = _.groupBy(allPosts, 'author');
    var toRender = [];
    _.each(toRenderGrouped, function (element) {
        toRender.push(new SumBlog(element[0].author, element.length,
            _.reduce(element, function (memo, num) { return memo + (num.isOnMainPortal() ? 1 : 0); }, 0),
            _.reduce(element, function (memo, num) { return memo + num.comments; }, 0),
            _.max(element, function (el) { return el.comments; })
        ))
    });
    var blogSumAll = _.reduce(toRender, function (memo, num) { return memo + num.blogSum; }, 0);
    _.each(toRender, function (element) {
        element.blogSumAllPercent = Math.round(element.blogSum / blogSumAll * 100) + "%";
    });
    var commentsSumAll = _.reduce(toRender, function (memo, num) { return memo + num.comments; }, 0);
    _.each(toRender, function (element) {
        element.commentsSumAllPercent = Math.round(element.comments / commentsSumAll * 100) + "%";
        element.commentsSumAvg = Math.round(element.comments / element.blogSum);
    });

    $("#licznik-allBlogPostsTable, .dataTables_wrapper").remove();
    $("div:contains('Dodaj nowy wpis'):eq(4)").prepend(CreateAllBlogPostsTable().outerHTML);
    $('#licznik-allBlogPostsTable')
        .on('init.dt', function () {
            var search = $("#licznik-allBlogPostsTable_filter label:first");
            search.attr("class", GetStyleLabel());
            search.css("margin-right", "20px");
            $("#licznik-allBlogPostsTable_info").attr("class", GetStyleLabel());
        })
        .DataTable({
            data: toRender,
            paging: false,
            "columns": [
                { "data": "author" },
                { "data": "blogSum" },
                { "data": "blogPortalSum" },
                { "data": "blogSumAllPercent" },
                { "data": "comments" },
                { "data": "commentsSumAllPercent" },
                { "data": "commentsSumAvg" },
            ],
            "language": {
                "processing": "Przetwarzanie...",
                "search": "Szukaj:",
                "lengthMenu": "Pokaż _MENU_ pozycji",
                "info": "Pozycje od _START_ do _END_ z _TOTAL_ łącznie",
                "infoEmpty": "Pozycji 0 z 0 dostępnych",
                "infoFiltered": "(filtrowanie spośród _MAX_ dostępnych pozycji)",
                "infoPostFix": "",
                "loadingRecords": "Wczytywanie...",
                "zeroRecords": "Nie znaleziono pasujących pozycji",
                "emptyTable": "Brak danych",
                "paginate": {
                    "first": "Pierwsza",
                    "previous": "Poprzednia",
                    "next": "Następna",
                    "last": "Ostatnia"
                },
                "aria": {
                    "sortAscending": ": aktywuj, by posortować kolumnę rosnąco",
                    "sortDescending": ": aktywuj, by posortować kolumnę malejąco"
                }
            },
            "order": [[1, "desc"]],
            "columnDefs": [
                {
                    "render": function (data, type, row) {
                        let commentsSumAvgName = cdom.get("div").class("licznik-maxCommentLink");

                        let link = cdom.get("a")
                        .attribute("target","_blank")
                        .attribute("href",row.maxCommentBlog.url)
                        .innerHTML("(" + row.maxCommentBlog.comments + ") " + row.maxCommentBlog.name);

                        commentsSumAvgName.append(link);
                        return commentsSumAvgName.element.outerHTML;
                    },
                    "targets": 7
                }
            ]
        });

    SetAllInfo();
}