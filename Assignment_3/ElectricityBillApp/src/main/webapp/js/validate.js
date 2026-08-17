$(function () {
    "use strict";

    $("#billForm").on("submit", function (e) {
        let valid = true;

        // Reset previous validation state
        $(this).find(".form-control").removeClass("is-invalid");

        const name = $("#consumerName").val().trim();
        const number = $("#consumerNumber").val().trim();
        const units = $("#units").val().trim();

        if (name === "") {
            $("#consumerName").addClass("is-invalid");
            valid = false;
        }

        if (number === "") {
            $("#consumerNumber").addClass("is-invalid");
            valid = false;
        }

        if (units === "" || isNaN(units) || Number(units) < 0) {
            $("#units").addClass("is-invalid");
            valid = false;
        }

        if (!valid) {
            e.preventDefault();
        }
    });

    // Live-clear the invalid state as the user types
    $("#billForm .form-control").on("input", function () {
        $(this).removeClass("is-invalid");
    });
});
