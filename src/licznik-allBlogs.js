async function CreateMainBlogStatButton() {
    let month = new Date().getMonth() + 1;
    let maxDate = new Date(new Date().setMonth(month));
    let maxMonth = maxDate.getMonth() + 1;
    month = month > 9 ? month : "0" + month
    maxMonth = maxMonth > 9 ? maxMonth : "0" + maxMonth

    let topContainer = document.createElement("div");

    let welcomeContainer = document.createElement("div");
    welcomeContainer.className = "allBlogsInfo";

    let monthInput = document.createElement("input");
    monthInput.type = "month";
    monthInput.className = GetStyleLabel();
    monthInput.id = "licznik-selectMonth";
    monthInput.name = monthInput.id;
    monthInput.max = maxDate.getFullYear() + "-" + maxMonth;
    monthInput.value = new Date().getFullYear() + "-" + month;

    let monthDiv = document.createElement("div");
    monthDiv.className = "monthDiv";
    monthDiv.appendChild(monthInput);

    let linkDiv = document.createElement("div");
    linkDiv.className = "licznik-statusInfoAllBlogs";
    linkDiv.appendChild(CreatePluginLink(pluginPage, pluginVersion));

    let allBlogsListContent = document.createElement("div");
    allBlogsListContent.className = "allBlogsListContent";

    welcomeContainer.appendChild(monthDiv);
    welcomeContainer.appendChild(await CreateButton("rozpocznij analizę wpisów z danego okresu", "blendingButton"));
    welcomeContainer.appendChild(linkDiv);
    welcomeContainer.appendChild(allBlogsListContent);

    topContainer.appendChild(welcomeContainer);

    let infoContainer = document.createElement("div");
    infoContainer.className = "infoContainer"

    let allBlogsInfoText = document.createElement("a");
    allBlogsInfoText.className = "allBlogsInfoText"

    infoContainer.appendChild(allBlogsInfoText);

    let mainContainer = document.createElement("div");
    mainContainer.appendChild(topContainer);
    mainContainer.appendChild(infoContainer);
    mainContainer.className = "allBlogInfo"

    return mainContainer;
}

function SetAllInfo(text) {
    if (text) {
        $(".allBlogsInfo").hide();
        $(".allBlogsInfoText").show();
        $(".allBlogsInfoText").text(text);
    }
    else {
        $(".allBlogsInfo").show();
        $(".allBlogsInfoText").hide();
    }
}

function ClearData() {
    allPosts = [];
    myPosts = [];
    hrefList = [];
    $("#allBlogPostsTable, .dataTables_wrapper").remove();
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
    let table = document.createElement("table");
    table.id = "allBlogPostsTable";
    table.className = GetStyleLabel();

    let thead = document.createElement("thead");
    thead.appendChild(CreateTh("Autor"));
    thead.appendChild(CreateTh("Wpisy blog"));
    thead.appendChild(CreateTh("Wpisy portal"));
    thead.appendChild(CreateTh("Udział wpisów"));
    thead.appendChild(CreateTh("Kom."));
    thead.appendChild(CreateTh("Udział kom."));
    thead.appendChild(CreateTh("Średnia kom."));
    thead.appendChild(CreateTh("Najwięcej kom. pod wpisem"));

    table.appendChild(thead);
    table.appendChild(document.createElement("tbody"));

    return table;
}

function CreateTh(text) {
    let th = document.createElement("th");
    th.innerHTML = text;
    return th;
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

    $("#allBlogPostsTable, .dataTables_wrapper").remove();
    $("div:contains('Dodaj nowy wpis'):eq(4)").prepend(CreateAllBlogPostsTable().outerHTML);
    $('#allBlogPostsTable')
        .on('init.dt', function () {
            var search = $("#allBlogPostsTable_filter label:first");
            search.attr("class", GetStyleLabel());
            search.css("margin-right", "20px");
            $("#allBlogPostsTable_info").attr("class", GetStyleLabel());
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
                        let commentsSumAvgName = document.createElement("div");
                        commentsSumAvgName.className = "licznik-maxCommentLink";

                        let link = document.createElement("a");
                        link.target = "_blank";
                        link.href = row.maxCommentBlog.url;
                        link.innerHTML = "(" + row.maxCommentBlog.comments + ") " + row.maxCommentBlog.name;

                        commentsSumAvgName.appendChild(link);
                        return commentsSumAvgName.outerHTML;
                    },
                    "targets": 7
                }
            ]
        });

    SetAllInfo();
}