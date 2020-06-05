// GLOBALS
//var apiUrl = "https://localhost:44373/";
var apiUrl = "https://mynoteapi.berkaysezer.com/";
var selectedNote = null;
var selectedLink = null; //dom element tutuyoruz

// FUNCTIONS
function checkLogin() {
    var loginData = getLoginData();

    if (!loginData || !loginData.access_token) {
        showLoginPage();
        return;
    }

    //is token valid
    ajax("api/Account/UserInfo", "GET", null, function (data) {
        showAppPage();
    }, function () {
        showLoginPage();
    });
}

function getAuthHeader() {
    return { Authorization: "Bearer " + getLoginData().access_token };
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

function updateNote() {
    ajax("api/Notes/Update/" + selectedNote.Id, "PUT",
        { Id: selectedNote.Id, Title: $("#title").val(), Content: $("#content").val() },
        function (data) {
            selectedLink.note = data;
            $(selectedLink).text(data.Title);
        },
        function () {

        }
    );
}

function addNote() {
    ajax("api/Notes/New", "POST",
        { Title: $("#title").val(), Content: $("#content").val() },
        function (data) {
            addMenuLink(data, true);
        },
        function () {

        }
    );
}

function showAppPage() {
    $(".only-logged-out").hide();
    $(".only-logged-in").show();
    $(".page").hide();

    //getnotes

    ajax("api/Notes/List", "GET", null,
        function (data) {

            $("#notes").html("");
            $("#navNotes").html("");
            addCloseButton();

            for (var i = 0; i < data.length; i++) {
                addMenuLink(data[i]);
            }

            $("#page-app").show();
        }, function () {

        });

}

function addCloseButton() {
    $("#navNotes").html('<a href="javascript:void(0)" class="closebtn" onclick="closeNav()">&times;</a>')
}

function openNav() {
    document.getElementById("navNotes").style.width = "250px";
    $("#navNotes").addClass("navOpened");
    $("#navBg").removeClass("d-none");
    //document.getElementById("page-app").style.marginLeft = "250px";
    //document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

function closeNav() {
    document.getElementById("navNotes").style.width = "0";
    $("#navNotes").removeClass("navOpened");
    $("#navBg").addClass("d-none");
}


function addMenuLink(note, isActive = false) {

    var a = $("<a/ > ").attr("href", "#")
        .addClass("list-group-item list-group-item-action show-note")
        .text(note.Title)
        .prop("note", note);

    var nav_a = $("<a/ > ").attr("href", "#")
        .addClass("show-note")
        .text(note.Title)
        .prop("note", note);

    if (isActive) {

        $(".show-note").removeClass("active")
        a.addClass("active");
        selectedLink = a[0];
        selectedNote = note;
    }
    $("#notes").prepend(a);
    $("#navNotes").prepend(nav_a);

}

function showLoginPage() {
    $(".only-logged-in").hide();
    $(".only-logged-out").show();
    $(".page").hide();
    $("#page-login").show();
}

function getLoginData() {
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

function resetNoteForm() {
    selectedNote = null;
    selectedLink = null;
    $(".show-note").removeClass("active");
    $("#title").val("");
    $("#content").val("");
}

// EVENTS
$(document).ajaxStart(function () {
    $(".loading").removeClass("d-none");
});

$(document).ajaxStop(function () {
    $(".loading").addClass("d-none");
});

$("#signupform").submit(function (event) {
    event.preventDefault();
    var formData = $(this).serialize();

    $.post(apiUrl + "api/Account/Register", formData, function (data) {
        resetLoginForms();
        success("Your account has been successfully created.");
    }).fail(function (xhr) {
        error(xhr.responseJSON.ModelState);
    });

});

$("#signinform").submit(function (event) {
    event.preventDefault();
    var formData = $(this).serialize();

    $.post(apiUrl + "Token", formData, function (data) {

        var datastr = JSON.stringify(data);
        if ($("#signinrememberme").prop("checked")) {
            sessionStorage.removeItem("login");
            localStorage["login"] = datastr;
        } else {
            localStorage.removeItem("login");
            sessionStorage["login"] = datastr;
        }

        resetLoginForms();
        success("You have been logged in successfully. Redirecting..");

        setTimeout(function () {
            $("#login").addClass("d-print-none");

            showAppPage();

        }, 1000);

    }).fail(function (xhr) {
        errorMessage(xhr.responseJSON.error_description);
    });

});

$("#btnDelete").click(function () {
    if (selectedNote) {
        if (confirm("Are you sure to delete the selected note?")) {
            ajax("api/Notes/Delete/" + selectedNote.Id, "DELETE", null,
                function (data) {
                    $(selectedLink).remove();
                    resetNoteForm();
                },
                function () {

                }
            );
        }
    }
    else {
        if (confirm("Are you sure to delete the draft?")) {
            resetNoteForm();
        }
    }
});

// https://getbootstrap.com/docs/4.0/components/navs/#events
$('#login a[data-toggle="pill"]').on('shown.bs.tab', function (e) {
    // e.target // newly activated tab
    // e.relatedTarget // previous active tab

    resetLoginForms();
});

$(".navbar-login a").click(function (event) {
    event.preventDefault();
    var href = $(this).attr("href");
    // https://getbootstrap.com/docs/4.0/components/navs/#via-javascript
    $('#pills-tab a[href="' + href + '"]').tab('show'); // Select tab by name
});

$("#btnLogout").click(function (event) {
    event.preventDefault();
    resetNoteForm();
    resetLoginForms();
    sessionStorage.removeItem("login");
    localStorage.removeItem("login");
    showLoginPage();
});

$("body").on("click", ".show-note", function (event) {
    event.preventDefault();
    selectedNote = this.note;
    selectedLink = this;
    $("#title").val(selectedNote.Title)
    $("#content").val(selectedNote.Content)

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

$(".add-new-note").click(function () {

    resetNoteForm();

});

$("#navBg").click(function () {
    closeNav();
});

//$("body").click(function () {
//    if ($("#navNotes").hasClass("navOpened")) {
//        closeNav();
//    }
//});

// ACTIONS
checkLogin();

