function SetMainBlogStatButton() {
    var month = new Date().getMonth() + 1;
    var maxDate = new Date(new Date().setMonth(month));
    var maxMonth = maxDate.getMonth() + 1;
    month = month > 9 ? month : "0" + month
    maxMonth = maxMonth > 9 ? maxMonth : "0" + maxMonth
    var allBlogsButton = "<div style='padding-top:10px;padding-bottom:20px;' class='allBlogsInfo'>"
        + "<div class='counterX link-color font-heading text-h7' style='text-align:center' >"
        + "<input type='month' id='blogMonth' name='blogMonth' style='text-align: right;' max=" + maxDate.getFullYear() + "-" + maxMonth + " value=" + new Date().getFullYear() + "-" + month + ">"
        + "<a style='margin-top:5px;' href='javascript:void(0)' class='btn'>rozpocznij analizę wpisów z danego okresu</a>"
        + "<div class='allInfo' style='padding-top:5px;' ><a href='http://dp.do/81509' class='color-heading text-bold'>stworzone przez: djfoxer [3.0]</a></div></div><div class='allBlogsListContent content-list'>"
        + "</div></div>";
    allBlogsButton += "<div style='padding-top:10px;padding-bottom:10px;'><div class='counterX link-color font-heading text-h7' style='text-align:center' ><label class='allBlogsInfoText'></label></div></div>"
    $(".search").prepend(allBlogsButton);
    $(".allBlogsInfo a:first").click(StartBlendingAllBlogs);
    $(".allBlogsInfoText").hide();
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
    var montToCheck = $("#blogMonth").val();
    if (montToCheck) {
        var montToCheckAll = montToCheck.split('-');
        var firstDay = new Date(montToCheckAll[0], montToCheckAll[1] - 1, 1);
        var lastDay = new Date(montToCheckAll[0], montToCheckAll[1], 0);
        lastDay.setHours(23, 59, 59, 999);
        GetFirstPage(montToCheckAll, lastDay, 1);
        SetAllInfo("wyszukuję wpisów, czekaj...");
    }
}

function GetFirstPage(montToCheckAll, lastDay, page) {
    var urlToCheck = "https://www.dobreprogramy.pl/Blog," + page + ".html";
    $.ajax({
        url: urlToCheck,
        dataType: "html",
        success: function (data) {
            SetAllInfo("wyszukuję wpisów, przeglądanie strony " + page + "...");
            data = GetHtmlWithoutLodingData(data);
            data = $(data);
            var createDate = ParseDate(data.find("#content article .content-info time").last().text());
            if (createDate <= lastDay) {

                ComputeAllBlogsData(montToCheckAll, page);
            }
            else {
                GetFirstPage(montToCheckAll, lastDay, ++page);
            }
        }
    })

}

function ComputeAllBlogsData(montToCheckAll, page) {
    SetAllInfo("rozpoczynam analizę strony " + page + "...");
    var urlToCompute = "https://www.dobreprogramy.pl/Blog," + page + ".html";
    $.ajax({
        url: urlToCompute,
        dataType: "html",
        success: function (data) {
            data = GetHtmlWithoutLodingData(data);
            data = $(data);
            var postsToAddToCompute = [];
            data.find("#content article").each(function (i, elem) {
                elem = $(elem);
                var postDate = ParseDate(elem.find("time").text());
                if (postDate && postDate.getFullYear() == montToCheckAll[0] && (postDate.getMonth() + 1) == montToCheckAll[1]) {
                    var postToAdd = new Post(elem.find("a").first().text(), elem.find("a").first().attr("href"), 0, elem.find("time").text()
                        , false, null, elem.find("aside span").last().text(), 1, elem.attr("id")
                        , elem.find(".content-info a").first().text());
                    postsToAddToCompute.push(postToAdd);
                }
            });

            if (postsToAddToCompute.length > 0) {
                allPosts = allPosts.concat(postsToAddToCompute);
                ComputeAllBlogsData(montToCheckAll, ++page);
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
    $("#content").prepend("<table id='allBlogPostsTable'>"
        + "<thead>"
        + "<th>Autor</th>"
        + "<th>Wpisy</th>"
        + "<th>Udział wpisów</th>"
        + "<th>Kom.</th>"
        + "<th>Udział kom.</th>"
        + "<th>Średnia kom.</th>"
        + "<th>Najwięcej kom. pod wpisem</th>"
        + "</thead><tbody> </tbody></table>");
    $('#allBlogPostsTable').DataTable({
        data: toRender,
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