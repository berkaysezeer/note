// Globals
var apiUrl = "https://localhost:44336/";
var loginData = null;
var selectedNote = null;
var selectedLink = null;

// Functions

function checkLogin() {
    //sessionstorage ve localstorage da tutulan login bilgilerine bakarak login olup olmadığına karar ver ve eğer loginse uygulamayı aç login değilse login/register sayfasını göster

    var loginData = getLoginData();

    if (!loginData || !loginData.access_token) {
        showLoginPage();
        return;
    }

    // is token valid?
    ajax("api/Account/UserInfo", "GET", null,
        function (data) {
            console.log(data);
            showAppPage();
        }, function () {
            showLoginPage();
        });
}

function getLoginData() {
    //sessionstorage'a bak eğer orada bulamadıysan localstorage'da kayıtlı login data'yı json'dan object'e dönüştür ve yolla eğer yoksa null yolla

    var json = sessionStorage["login"] || localStorage["login"];

    if (json) {
        try {
            return JSON.parse(json);
        } catch (e) {
            return null;
        }
    }
    return null;

}

function showAppPage() {
    $(".only-logged-in").show();
    $(".only-logged-out").hide();
    $(".page").hide();

    //notları getir
    ajax("api/Notes/List", "GET", null,
        function (data) {

            $("#notes").html("");

            for (var i = 0; i < data.length; i++) {

                addMenuLink(data[i]);
            }
            //sayfa hazır olduğunda göster
            $("#page-app").show();
        },
        function () {
        });

}

function addMenuLink(note, isActive = false) {
    var a = $("<a/>")
        .attr("href", "#")
        .addClass("list-group-item list-group-item-action show-note")
        .text(note.Title)
        .prop("note", note);

    if (isActive) {
        $(".show-note").removeClass("active");
        a.addClass("active");
        selectedLink = a[0];
        selectedNote = note;
    }

    $("#notes").append(a);
}

function showLoginPage() {
    $(".only-logged-in").hide();
    $(".only-logged-out").show();
    $(".page").hide();
    $("#page-login").show();
}

function ajax(url, type, data, successFunc, errorFunc) {
    $.ajax({
        url: apiUrl + url,
        type: type,
        data: data,
        headers: getAuthHeader(),
        success: successFunc,
        error: errorFunc
    });
}

function addNote() {
    ajax("api/Notes/New/", "POST",
        { Title: $("#title").val(), Content: $("#content").val() },
        function (data) {
            addMenuLink(data, true);
        }, function () {

        });
}

function updateNote() {
    ajax("api/Notes/Update/" + selectedNote.Id, "PUT",
        { Id: selectedNote.Id, Title: $("#title").val(), Content: $("#content").val() },
        function (data) {
            selectedLink.note = data;
            selectedLink.textContent = data.Title;
            //$(selectedLink).text(data.Title);
        }, function () {

        });
}

function getAuthHeader() {
    return { Authorization: "Bearer " + getLoginData().access_token }
}

function success(message) {
    $(".tab-pane.active .message")
        .removeClass("alert-danger")
        .addClass("alert-success")
        .text(message)
        .show();
}

function error(modelState) {
    if (modelState) {
        var errors = [];
        for (var prop in modelState) {
            for (var i = 0; i < modelState[prop].length; i++) {
                errors.push(modelState[prop][i]);
            }
        }

        var ul = $("<ul/>");
        for (var i = 0; i < errors.length; i++) {
            ul.append($("<li/>").text(errors[i]));
        }
        $(".tab-pane.active .message")
            .removeClass("alert-success")
            .addClass("alert-danger")
            .html(ul)
            .show();
    }
}

function errorMessage(message) {
    if (message) {
        $(".tab-pane.active .message")
            .removeClass("alert-success")
            .addClass("alert-danger")
            .text(message)
            .show();
    }
}

function resetLoginForms() {
    $(".message").hide();
    $("#login form").each(function () {
        this.reset();
    });
}

function resetNoteForms() {
    // seçili dom elementini null yap
    // seçili notu null yap
    // seçili notun active classını kaldır
    // seçili notun title ve contentini sıfırla
    selectedLink = null;
    selectedNote = null;
    $(".show-note").removeClass("active");
    $("#title").val("");
    $("#content").val("");
}

// Events
$(document).ajaxStart(function () {
    $(".loading").removeClass("d-none");
});

$(document).ajaxStop(function () {
    $(".loading").addClass("d-none");
});

//register
$("#signupform").submit(function (event) {
    event.preventDefault();
    var formdata = $(this).serialize();

    $.post(apiUrl + "api/Account/Register", formdata, function (data) {
        resetLoginForms();
        success("Your account has been successfully created.");

    }).fail(function (xhr, status, err) {
        error(xhr.responseJSON.ModelState);
    });

});

//login
$("#signinform").submit(function (event) {
    event.preventDefault();
    var formdata = $(this).serialize();

    $.post(apiUrl + "Token", formdata, function (data) {

        var datastr = JSON.stringify(data);
        if ($("#signinrememberme").prop("checked")) {
            sessionStorage.removeItem("login");
            localStorage["login"] = datastr;
        } else {
            sessionStorage["login"] = datastr;
        }

        resetLoginForms();
        success("You have been logged in successfully. Redirecting..");
        setTimeout(function () {
            resetLoginForms();
            showAppPage();
        }, 1000);

    }).fail(function (xhr, status, err) {
        errorMessage(xhr.responseJSON.error_description);
    });

});

// https://getbootstrap.com/docs/4.0/components/navs/#events	
$('#login a[data-toggle="pill"]').on('shown.bs.tab', function (e) {
    // e.target // newly activated tab
    // e.relatedTarget // previous active tab

    resetLoginForms();
});

// https://getbootstrap.com/docs/4.0/components/navs/#via-javascript
$(".navbar-login a").click(function (event) {
    event.preventDefault();
    var href = $(this).attr("href");
    $('#pills-tab a[href="' + href + '"]').tab('show'); // Select tab by name
});

//logOut
$("#btnLogout").click(function (event) {
    event.preventDefault();
    sessionStorage.removeItem("login");
    localStorage.removeItem("login");
    showLoginPage();
});

// add New note
$(".add-new-note").click(function () {
    resetNoteForms();
});

$("body").on("click", ".show-note", function (event) {
    event.preventDefault();
    selectedNote = this.note;
    selectedLink = this;
    $("#title").val(selectedNote.Title);
    $("#content").val(selectedNote.Content);

    $(".show-note").removeClass("active");
    $(this).addClass("active");
});

$("#frmNote").submit(function (event) {
    event.preventDefault();
    if (selectedNote) {
        updateNote();
    } else {
        addNote();
    }
});

// Actions
checkLogin();