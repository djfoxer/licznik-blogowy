if ($(".profile-info").length == 1) {
    blogerName = $("img[alt='User avatar']").parent().text();
    tab = "<div style='padding-top:10px;padding-bottom:20px;' class='myPostInfo'><div class='counterX link-color font-heading text-h7' style='text-align:center' ><a href='javascript:void(0)' class='btn'>rozpocznij analizę wpisów blogera " + blogerName + "</a><div class='myInfo' style='padding-top:5px;' ><a href='https://dp.do/106860' class='color-heading text-bold'>stworzone przez: djfoxer [3.0]</a></div></div><div class='myPosts content-list'>"
        + "</div></div>";
    $("#badges").prepend(tab);

    $(".myPostInfo a:first").click(StartBlending);
    isYourProfile = $(".userMenu li:last a strong").text() === blogerName;
}
else {
    blogerName = null;
    if (window.location.href.startsWith("https://www.dobreprogramy.pl/blogi")) {
        SetMainBlogStatButton();
    }
}