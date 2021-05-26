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
    if ($(".myPostInfo").length == 0) {
        ClearOldDivs();
        $("h3:contains('O mnie'):first").prepend(await CreateSingleBlogStatButton());
        $(".myPostInfo .blendBlog").click(StartBlending);

    }
}

async function SetMainBlogStatButton() {
    if ($(".allBlogInfo").length == 0) {
        ClearOldDivs();
        $("h3:contains('Popularne tagi')").parent().parent().parent().prepend(await CreateMainBlogStatButton());
        $(".blendingButton").click(StartBlendingAllBlogs);
        $(".allBlogsInfoText").hide();
    }
}

function ClearOldDivs() {
    $(".myPostInfo").remove();
    $(".allBlogInfo").remove();
    blogerName = null;
    isYourProfile = false;
    allPosts = [];
    myPosts = [];
    hrefList = [];
}

