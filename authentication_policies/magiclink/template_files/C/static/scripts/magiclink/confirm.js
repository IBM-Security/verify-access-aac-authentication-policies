window.addEventListener("load", startup);

function startup() {
    populateStrings();

    var jsLinks = document.querySelectorAll('[href="#"]');

    for (let i = 0; i < jsLinks.length; i++) {
        jsLinks[i].addEventListener("click", function(event) {
            event.preventDefault(); // Prevent default action (a following a link)
        }, false);
    }

    document.getElementById("choice-section").style.left = '';
    document.getElementById("choice-section").classList.add('bx--dialog-content--visible');
    document.getElementById("choice-section").classList.remove('bx--dialog-content--hidden');
}

function populateStrings() {
    document.title = "Magic Link Confirmation";
    document.querySelector('#choice-section h1').textContent = "Magic Link Confirmation";
    document.querySelector('#choice-section p').textContent = "Click the login button to confirm the magic link login.";
    document.getElementById("loginButton").value = authsvcMsg.login;

    document.getElementById("welcome_img").src = "/mga/sps/static/design_images/emailotp.svg";
}
