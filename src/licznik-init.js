var computing = false;
$("body").on('DOMSubtreeModified', function () {
    StatButtonWatch();
});

async function StatButtonWatch() {
    if (computing) {
        return;
    }
    computing = true;

    let currentUrl = $(location).attr('href');
    if (currentUrl == "https://www.dobreprogramy.pl/blogi") {
        await SetMainBlogStatButton();
    }
    else if (currentUrl.startsWith("https://www.dobreprogramy.pl/@")) {
        await SetSingleBlogStatButton();
    }
    else {
        ClearOldDivs();
    }

    computing = false;
}

async function SetSingleBlogStatButton() {
    if ($(".licznik-singleBlogInfo").length == 0) {
        ClearOldDivs();
        $("h3:contains('O mnie'):first").prepend(await CreateSingleBlogStatButton());
        $(".licznik-singleBlogInfo .blendBlog").click(StartBlending);
        $(".licznik-singleBlogInfo .backupBlog").click( () =>  StartBackup());
    }
}

async function SetMainBlogStatButton() {
    if ($(".licznik-allBlogInfo").length == 0) {
        ClearOldDivs();
        $("h3:contains('Popularne tagi')").parent().parent().parent().prepend(await CreateMainBlogStatButton());
        $(".blendingButton").click(StartBlendingAllBlogs);
        $(".licznik-allBlogsInfoText").hide();
    }
}

function ClearOldDivs() {
    $(".licznik-singleBlogInfo").remove();
    $(".licznik-allBlogInfo").remove();
    blogerName = null;
    isYourProfile = false;
    allPosts = [];
    myPosts = [];
    hrefList = [];
}

