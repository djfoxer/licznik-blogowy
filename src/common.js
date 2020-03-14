function Post(name, url, counter, date, info, edit, comments, status, id, author) {
    this.name = name;
    this.url = url;
    this.counter = parseInt(counter);
    this.date = date;
    this.realDate = ParseDate(date);
    this.info = info;
    this.edit = url;
    this.comments = parseInt(comments);
    this.status = status;
    this.commentList = new Array();
    this.id = id;
    this.fullUrl = url;
    this.author = author;
}

function Comment(author, date, likes, ano) {
    this.author = author;
    this.date = date;
    this.likes = likes;
    this.ano = ano;
}

function ParseDate(date) {
    if (date)
        return new Date(date.substring(6, 10), parseInt(date.substring(3, 5)) - 1, parseInt(date.substring(0, 2))
            , parseInt(date.substring(11, 13)), parseInt(date.substring(14, 16)));
    else return null;
}

function GetHtmlWithoutLodingData(rawResponse) {
    var clear = rawResponse.replace(/<img[^>]*>/g, "");
    return safeResponse.cleanDomString(clear);
}

safeResponse = function () {

    var validAttrs = ["class", "id", "href", "style"];

    this.__removeInvalidAttributes = function (target) {
        var attrs = target.attributes, currentAttr;

        for (var i = attrs.length - 1; i >= 0; i--) {
            currentAttr = attrs[i].name;

            if (attrs[i].specified && validAttrs.indexOf(currentAttr) === -1) {
                target.removeAttribute(currentAttr);
            }

            if (
                currentAttr === "href" &&
                /^(#|javascript[:])/gi.test(target.getAttribute("href"))
            ) {
                target.parentNode.removeChild(target);
            }
        }
    }

    this.__cleanDomString = function (data) {
        var parser = new DOMParser;
        var tmpDom = parser.parseFromString(data, "text/html").body;

        var list, current, currentHref;

        list = tmpDom.querySelectorAll("script,img");

        for (var i = list.length - 1; i >= 0; i--) {
            current = list[i];
            current.parentNode.removeChild(current);
        }

        list = tmpDom.getElementsByTagName("*");

        for (i = list.length - 1; i >= 0; i--) {
            __removeInvalidAttributes(list[i]);
        }

        return tmpDom.innerHTML;
    }

    return {
        cleanDomString: function (html) {
            return __cleanDomString(html)
        }
    }
}();