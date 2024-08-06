window.addEventListener("load", startup);

function startup() {
    populateStrings();

    document.getElementById("loginButton").addEventListener('click', function() {
        validateEmail(this)
    });

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
    document.title = "Magic Link Login";
    document.querySelector('#choice-section h1').textContent = "Magic Link Login";
    document.querySelector('#choice-section p').textContent = "Enter your email address and click the Login button to receive a single use login link";
    document.getElementById("loginButton").value = authsvcMsg.login;

    document.getElementById("welcome_img").src = "/mga/sps/static/design_images/emailotp.svg";
}

function validateEmail(button) {
    var container = button.parentNode.parentNode;
    var emailInput = container.querySelector('#email');
    var email = emailInput.value;

    if (checkValid(emailInput, "email")) {
        document.querySelector(".bx--loader").classList.remove('hidden');
        document.querySelector(".bx--welcome-illustrations .bx--launch-animation").classList.add('hidden');
        document.getElementById("emailForm").submit();
    }
}

function checkValid(input) {
    var valid = false;
    var value = input.value;
    if (value != null && value != "" && input.validity.valid) {
        valid = true;
    }
    if (valid) {
        if (input.classList.contains('input-invalid')) {
            input.classList.remove('input-invalid');
        }
    } else {
        input.classList.add('input-invalid');
    }

    return valid;
}
