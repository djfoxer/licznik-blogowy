var pluginVersion = "4.0";
var pluginPage = "https://www.djfoxer.pl/licznik_blogowy_redirect.html";

class Post {
    constructor(name, url, counter, date, info, edit, comments, status, id, author) {
        this.name = name;
        this.url = url;
        this.counter = counter;
        this.date = date;
        this.realDate = date;
        this.info = info;
        this.edit = url;
        this.comments = comments;
        this.status = status;
        this.commentList = new Array();
        this.id = id;
        this.fullUrl = url;
        this.author = author;
    }

    isOther() {
        return this.status < 3;
    }

    isOnMainBlog() {
        return this.status >= 3;
    }

    isOnMainPortal() {
        return this.status == 4;
    }
}

class Comment {
    constructor(author, date, likes, disLikes, ano) {
        this.author = author;
        this.date = date;
        this.likes = likes;
        this.disLikes = disLikes;
        this.ano = ano;
    }
}

var cdom = {
    element: null,

    get: function (o) {
        var obj = Object.create(this);
        obj.element = document.createElement(o);
        return obj;
    },
    getById: function (id) {
        var obj = Object.create(this);
        obj.element = document.getElementById(id);
        return obj;
    },
    append: function (o) {
        this.element.appendChild(o.element);
        return this;
    },
    text: function (t) {
        this.element.appendChild(document.createTextNode(t));
        return this;
    },
    attribute: function (k, v) {
        this.element.setAttribute(k, v);
        return this;
    },
    css: function (c) {
        this.element.classList.add(c);
        return this;
    },
    class: function (c) {
        this.element.className = c;
        return this;
    },
    innerHTML: function (c) {
        this.element.innerHTML = c;
        return this;
    },
    event: function (e, f) {
        this.element.addEventListener(e, f, false);
        return this;
    }
}

function CreatePluginLink(pluginPage, pluginVersion) {

    let aHref = cdom.get("a")
        .attribute("target", "_blank")
        .attribute("href", pluginPage)
        .innerHTML("Licznik Blogowy by djfoxer [" + pluginVersion + "]")
        .element;
    return aHref;
}

function CreatePost(elem) {
    var postDate = new Date(elem.published_on);
    var postToAdd = new Post(
        elem.title,
        "https://www.dobreprogramy.pl/@" + elem.created_by.username + "/" + elem.slug + ",blog," + elem.id,
        0,
        postDate,
        false,
        null,
        elem.comments_count,
        elem.site_dobreprogramy,
        elem.id,
        elem.created_by.username
    );
    return postToAdd;
}

async function CreateButton(text, className) {
    let sourceElement = FindButtonClassInObject($("*"));
    if (!sourceElement) {
        let response = await DownloadBlogRawHtml();
        sourceElement = FindButtonClassInObject($(response));
    }

    let button = cdom
        .get("div")
        .class(className + " " + sourceElement)
        .attribute("role", "button")
        .append(cdom
            .get("div")
            .innerHTML(text)
        );

    return button.element;
}
function FindButtonClassInObject(searchSource) {
    return searchSource.find("div:contains('Dodaj nowy wpis'):last").parent().parent().attr("class");
}

async function DownloadBlogRawHtml() {
    return $.ajax({
        url: "https://www.dobreprogramy.pl/blogi",
        dataType: "html",
        type: "GET"
    });
}

function GetStyleLabel() {
    return $("[placeholder='Szukaj...']:first").attr("class");
}

function GetStyleSpan() {
    return $("span:contains('dobreprogramy')").attr("class");
}

function FixHttpsUrl(url) {
    if (!url) {
        return url;
    }
    return url.replace("http://www.dobreprogramy.pl/", "https://www.dobreprogramy.pl/");
}
