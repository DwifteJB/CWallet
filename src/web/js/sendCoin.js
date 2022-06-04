// Use JQuery :)
// Client side code :P

// If button is clicked, ask to confirm payment.
let notClicked = true;
$( "#sendCoinBtn" ).on( "click", function() {
    if (notClicked == true) {
        $("#sendCoinBtn").removeClass("btn-primary")
        $("#sendCoinBtn").addClass("btn-success")
        $("#sendCoinBtn").text(`Are you sure?`);
        notClicked = false
    } else if (notClicked == false) {
        $.ajax({
            url: "/api/user:SendCoin",
            type: "post",
            data: $(sendForm).serialize() + '&recipientType=' + $("#paymentType").val(),
            success: async function (response) {
               // lets show the user the response!
               const errorParser = {
                0: "Success!",
                1: "You can't send money to your own account!",
                2: "This account doesn't exist.",
                3: "Insufficient funds on your account.",
                4: "The value you providied is a negative integer or zero.",
                5: "Unknown error. This is bad. Contact us on discord."
               }
               const status = new bootstrap.Modal('#status');
               const sendModal = new bootstrap.Modal('#sendCoin1');
               // set modal details
               if (response.error == true || response.code != 0) {
                   
                   // something bad occured.
                   $("#successStatusHead").text(errorParser[response.code])
                   $("#sendCoinLabel2").removeClass("successfulText"); // in case class already exists
                   $("#sendCoinLabel2").addClass("failedText");
                   $("#sendCoinLabel2").text("It seems we couldn't send your coins.");
                   sendModal.hide();
                   status.show();
               } else {
                   // it has sent!
                   $("#sendCoinLabel2").removeClass("failedText"); // in case class already exists
                   $("#sendCoinLabel2").addClass("successfulText");
                   $("#sendCoinLabel2").text("Sucessfully sent your coins!");
                   $("#successStatusHead").text(`We have successfully sent your coins to the recipient.`)
                   // LATER: ASK SERVER TO UPDATE BALANCE :)
                   sendModal.hide();
                   status.show();
               }
            },
            error: function(abc,textStatus, errorThrown) {
               console.log(textStatus, errorThrown);
            }
        });
    
        
    }
});


// Improvements for UX
$("#paymentType").on('changed.bs.select',function(e) {
    $("#enterText").text(`Enter their ${e.target.selectedOptions[0].innerText}`)
})