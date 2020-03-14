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
