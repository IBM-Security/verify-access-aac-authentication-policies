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
    document.title = "Magic Link Sent";
    document.querySelector('#choice-section h1').textContent = "Magic Link Sent";
    document.getElementById("p1").textContent = "If a valid email address was provided, an email has been sent containing a single use link that can be used to complete the login. Note that this link will time out after a predefined period of time.";
    document.getElementById("p2").textContent = "Please check your email for further instructions.";
    document.getElementById("p3").textContent = "If you did not receive the email, check the supplied email address is correct and use the button below to try again.";

    document.getElementById("welcome_img").src = "/mga/sps/static/design_images/emailotp.svg";
}
