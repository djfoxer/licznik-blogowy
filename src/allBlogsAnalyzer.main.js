var pluginVersion = "4.0";
var pluginPage = "https://www.djfoxer.pl/licznik_blogowy_redirect.html";

function SetMainBlogStatButton() {
    var month = new Date().getMonth() + 1;
    var maxDate = new Date(new Date().setMonth(month));
    var maxMonth = maxDate.getMonth() + 1;
    month = month > 9 ? month : "0" + month
    maxMonth = maxMonth > 9 ? maxMonth : "0" + maxMonth
    var allBlogsButton = "<div><div class='allBlogsInfo'>"
        + "<div style='text-align:center'>"
        + "<div style='padding-bottom:10px'><input type='month' class='" + GetStyleLabel() + "' id='blogMonth' name='blogMonth' max='" + maxDate.getFullYear() + "-" + maxMonth + "' value='" + new Date().getFullYear() + "-" + month + "' /></div>"
        + CreateButton("rozpocznij analizę wpisów z danego okresu", "blendingButton")
        + "<div class='allInfo'><a target='_blank'  href='" + pluginPage + "'>Licznik Blogowy by djfoxer [" + pluginVersion + "]</a></div>"
        + "<div class='allBlogsListContent'></div>"
        + "</div></div>";
    allBlogsButton += "<div style='padding-top:10px;padding-bottom:10px;'><div style='text-align:center' ><a style='cursor:wait !important' class='allBlogsInfoText'></a></div></div></div>"

    $("h3:contains('Popularne tagi')").parent().parent().parent().bind('DOMSubtreeModified', function () {
        if ($(".allBlogsInfo").length == 0) {
            $("h3:contains('Popularne tagi')").parent().parent().parent().prepend(allBlogsButton);
            $(".blendingButton").click(StartBlendingAllBlogs);
            $(".allBlogsInfoText").hide();
        }
    });
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

function CreateButton(text, className) {
    var parent = $("div:contains('Dodaj nowy wpis'):last").parent();
    return "<div class='" + className + " " + parent.parent().attr("class") + "' role='button'><div class='" + parent.attr("class") + "' >" + text + "</div></div>";
}

function GetStyleLabel() {
    return $("[placeholder='Szukaj...']:first").attr("class");
}

function StartBlendingAllBlogs() {
    ClearData();
    var montToCheck = $("#blogMonth").val();
    if (montToCheck) {
        var montToCheckAll = montToCheck.split('-');
        var firstDay = new Date(montToCheckAll[0], montToCheckAll[1] - 1, 1);
        var lastDay = new Date(montToCheckAll[0], montToCheckAll[1], 0);
        lastDay.setHours(23, 59, 59, 999);
        GetFirstPage(montToCheckAll, lastDay, 0, "https://www.dobreprogramy.pl/api/blogs/?limit=20&ordering=-published_on&pub_state=1&site_dobreprogramy__gte=3");
        SetAllInfo("wyszukuję wpisów, czekaj...");
    }
}

function GetFirstPage(montToCheckAll, lastDay, page, urlToCheck) {
    if (!urlToCheck) {
        return;
    }
    $.ajax({
        url: FixHttpsUrl(urlToCheck),
        dataType: "json",
        success: function (data) {
            SetAllInfo("wyszukuję wpisów, przeglądanie strony " + page + "...");
            if (new Date(data.results[data.results.length - 1].published_on) <= lastDay) {
                ComputeAllBlogsData(montToCheckAll, page, urlToCheck);
            }
            else {
                GetFirstPage(montToCheckAll, lastDay, ++page, data.next);
            }
        }
    })

}

function FixHttpsUrl(url) {
    if (!url) {
        return url;
    }
    return url.replace("http://www.dobreprogramy.pl/api/blogs", "https://www.dobreprogramy.pl/api/blogs");
}

function ComputeAllBlogsData(montToCheckAll, page, urlToCompute) {
    if (!urlToCompute) {
        return;
    }
    SetAllInfo("rozpoczynam analizę strony " + page + "...");
    $.ajax({
        url: FixHttpsUrl(urlToCompute),
        dataType: "json",
        success: function (data) {
            var postsToAddToCompute = [];

            data.results.forEach(elem => {
                var postDate = new Date(elem.published_on);
                if (postDate && postDate.getFullYear() == montToCheckAll[0] && (postDate.getMonth() + 1) == montToCheckAll[1]) {
                    var postToAdd = new Post(
                        elem.title,
                        "https://www.dobreprogramy.pl/@" + elem.created_by.username + "/" + elem.slug + ",blog," + elem.id,
                        0,
                        postDate,
                        false,
                        null,
                        elem.comments_count,
                        1,
                        elem.id,
                        elem.created_by.username
                    );
                    postsToAddToCompute.push(postToAdd);
                }
            });

            if (postsToAddToCompute.length > 0) {
                allPosts = allPosts.concat(postsToAddToCompute);
                ComputeAllBlogsData(montToCheckAll, ++page, data.next);
            }
            else {
                RenderAllBlogTable(allPosts);
            }
        }
    })
}

function SumBlog(author, blogSum, comments, maxCommentBlog) {
    this.author = author;
    this.blogSum = blogSum;
    this.comments = comments;
    this.blogSumAllPercent = 0;
    this.commentsSumAllPercent = 0;
    this.commentsSumAvg = 0;
    this.maxCommentBlog = maxCommentBlog;
}

function RenderAllBlogTable(allPosts) {
    SetAllInfo("jeszcze chwilka...");
    var toRenderGrouped = _.groupBy(allPosts, 'author');
    var toRender = [];
    _.each(toRenderGrouped, function (element) {
        toRender.push(new SumBlog(element[0].author, element.length,
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
    $("div:contains('Dodaj nowy wpis'):eq(4)").prepend("<table id='allBlogPostsTable' class='" + GetStyleLabel() + "'>"
        + "<thead>"
        + "<th>Autor</th>"
        + "<th>Wpisy</th>"
        + "<th>Udział wpisów</th>"
        + "<th>Kom.</th>"
        + "<th>Udział kom.</th>"
        + "<th>Średnia kom.</th>"
        + "<th>Najwięcej kom. pod wpisem</th>"
        + "</thead><tbody> </tbody></table>");
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
                        return "<div class='commentsSumAvgName'><a target='_blank' href='" + row.maxCommentBlog.url + "'>" + "(" + row.maxCommentBlog.comments + ") " + row.maxCommentBlog.name + "</a></div>"
                    },
                    "targets": 6
                }
            ]
        });

    SetAllInfo();
}