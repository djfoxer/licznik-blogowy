function FFhack() {
    if (fuckSwitchShow === true)
        ShowChart();
    else
        HideChart();
}

function HideChart() {
    fuckSwitchShow = true;
    $(".licznik-allCharts").remove();
    $(".licznik-toggleOpenCharts a").text("pokaż wykresy");
}

var randomColorGenerator = function () {
    return '#' + (Math.random().toString(16) + '0000000').slice(2, 8);
};

var rgb2hex = function (red, green, blue) {
    var rgb = blue | (green << 8) | (red << 16);
    return '#' + (0x1000000 + rgb).toString(16).slice(1)
}

var rgb2hexFormat = function (text, alfa) {
    return "rgba(" + text.split(',')[0].split('(')[1] * 1 + "," + text.split(',')[1] * 1 + "," + text.split(',')[2].split(')')[0] * 1 + "," + alfa + ")";
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
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                legend: {
                    display: false
                }
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

var drawChartPie = function (title, labels, data, canvas) {

    mainHex1 = rgb2hexFormat(mainColor, "0.5");
    mainHex2 = rgb2hexFormat(mainColor, "0.3");

    new Chart(canvas, {
        type: 'pie',
        options: {
            plugins: {
                title: {
                    display: true,
                    text: title
                },
                legend: {
                    display: false
                }
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
    $(".licznik-toggleOpenCharts a").text("ukryj wykresy");
    fuckSwitchShow = false;

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
    blogMain = 0;
    blogPortal = 0;
    blogOther = 0;

    comUsers = {};
    comUserAno = { author: "NIEZALOGOWANY", counter: 0, likes: 0, disLikes: 0 };
    comUsersName = [];
    comUsersValue = [];

    for (var i = 0; i < allPosts.length; i++) {
        tabDay[allPosts[i].realDate.getDay()] += 1;
        tabMonth[allPosts[i].realDate.getMonth()] += 1;

        if (allPosts[i].isOther()) {
            blogOther += 1;
        }
        if (allPosts[i].isOnMainBlog()) {
            blogMain += 1;
        }
        if (allPosts[i].isOnMainPortal()) {
            blogPortal += 1;
        }

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
                    comUserAno.disLikes += currentComment.disLikes;
                }
                else {
                    if (!comUsers[currentComment.author]) {
                        comUsers[currentComment.author] = { author: currentComment.author, counter: 0, likes: 0, disLikes: 0 };
                    }
                    comUsers[currentComment.author].counter += 1;
                    comUsers[currentComment.author].likes += currentComment.likes;
                    comUsers[currentComment.author].disLikes += currentComment.disLikes;
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

    disLikes = comUsers.sort(function (a, b) { return b.disLikes - a.disLikes; }).slice(0, 10);
    disLikesName = []
    disLikesValues = [];
    for (var index = 0; index < disLikes.length; index++) {
        var element = comUsers[index];
        if (element.disLikes > 0) {
            disLikesName.push(element.author);
            disLikesValues.push(element.disLikes);
        }
    }

    $("header").next().next().children().children().eq(0).prepend("<div class='licznik-allCharts'></div>");
    mainHex = rgb2hexFormat(mainColor, "0.8");

    let daysOfWeekNames = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
    let monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

    drawChart('Liczba komentarzy - godzinowo',
        hoursName,
        hoursCom,
        CreateCanvasForChart("canvas6")
    );

    drawChart("Top 10 komentujących wg liczby komentarzy (twoich: " + userComments + ", niezalogowanych: " + comUserAno.counter + ")",
        comUsersName,
        comUsersValue,
        CreateCanvasForChart("canvas7")
    );

    drawChart("Top 10 komentujacych wg Łapek w górę",
        likesName,
        likesValues,
        CreateCanvasForChart("canvas8")
    );

    drawChart("Top 10 komentujacych wg Łapek w dół",
        disLikesName,
        disLikesValues,
        CreateCanvasForChart("canvas14")
    );

    drawChart("Liczba komentarzy - dzień tygodnia",
        daysOfWeekNames,
        tabDayComments,
        CreateCanvasForChart("canvas9")
    );

    drawChart("Liczba komentarzy - miesięcznie",
        monthNames,
        tabMonthComments,
        CreateCanvasForChart("canvas10")
    );

    drawChart("Liczba komentarzy - rocznie",
        year_nameComments,
        year_countComments,
        CreateCanvasForChart("canvas11")
    );

    var year_countPostComments = year_countComments.slice();
    for (var index = 0; index < year_countPostComments.length; index++) {
        var ind = year_name.indexOf(year_nameComments[index]);
        if (ind >= 0 && year_countPostComments[index] > 0) {
            year_countPostComments[index] = Math.round(year_countPostComments[index] / year_count[ind])
        }
    }

    drawChart("Średnia liczba komentarzy na wpis rocznie",
        year_nameComments,
        year_countPostComments,
        CreateCanvasForChart("canvas12")
    );

    drawChart("Liczba wpisów - godzinowo",
        hoursName,
        hours,
        CreateCanvasForChart("canvas4")
    );

    drawChart("Liczba wpisów - dzień tygodnia",
        daysOfWeekNames,
        tabDay,
        CreateCanvasForChart("canvas1")
    );

    drawChart("Liczba wpisów - miesięcznie",
        monthNames,
        tabMonth,
        CreateCanvasForChart("canvas5")
    );

    drawChart("Liczba wpisów - rocznie",
        year_name,
        year_count,
        CreateCanvasForChart("canvas3")
    );

    drawChart("Promowane wpisy",
        ["Portal", "Blogi", "Pozostałe"],
        [blogPortal, blogMain, blogOther],
        CreateCanvasForChart("canvas2")
    );
}

function CreateCanvasForChart(id) {
    $(".licznik-allCharts").prepend(cdom.get("canvas").attribute("id", id).element);
    return id;
}
