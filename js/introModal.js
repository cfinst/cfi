---
---

// This function starts the Shepherd tour.
function takeTour(){
    var tour = new Shepherd.Tour({
        defaults: {
              classes: 'shepherd-theme-arrows'
            , scrollTo: true
            , showCancelLink: true
          }
      })
    ;
  {% comment %}Create the tour using Jekyll{% endcomment %}
  {% for stop in site.data.tour %}
    tour.addStep('step{{ forloop.index }}', {
        text: '{{ stop.text }}'
        , attachTo: '{{ stop.node }} {% if stop.orientation %}{{ stop.orientation }}{% else %}bottom{% endif %}'
        , buttons: [
              {
                  text: 'Exit'
                , action: tour.complete
              }
          {% unless forloop.first %}
            , {
                  text: 'Back'
                , action: tour.back
              }
          {% endunless %}
          {% unless forloop.last %}
            , {
                  text: 'Next'
                , action: tour.next
              }
          {% endunless %}
          ]
    });
  {% endfor %}
    tour.start();
}

// This triggers the introduction popup
// that shows only the first time the page is loaded.
// This function should be invoked once, on page load.
function triggerIntroModal(){

    // Determine whether or not the current user has seen
    // this page any time in the previous 24 hours, using cookies.
    // Cookie documentation at https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
    var pageSeen = document.cookie.indexOf("pageSeen") !== -1;

    // Only show the intro modal if the current user
    // is visiting the page for the first time.
    if(!pageSeen){
        var introModal = $("#intro-modal")

        // Show the modal, via Bootstrap"s API.
        // See http://getbootstrap.com/javascript/#via-javascript
        introModal.modal({

            // This option tells Bootstrap to load the content from this file,
            // which is compiled using Jekyll based on configurable content
            // from _modals/intro.md.
            remote: "/modals/intro.html"
        });

        // The cookie will expire after one day.
        var expiryDate = d3.timeDay.offset(new Date, 1);

        // Track that the current user has visited this page using cookies.
        document.cookie = "pageSeen=true;expires=" + expiryDate.toUTCString();

        // Add an event listener to the "Take tour" button after the modal loads.
        // `loaded` event documented at http://getbootstrap.com/javascript/#modals-events
        introModal.on("loaded.bs.modal", function (e) {
            d3.selectAll(".take-tour-button")
                .attr("type", "button")
                .classed("btn btn-primary btn-block", true)
                .text("Take the tour!")
                .on("click", function (event) {
                    introModal.modal("hide");
                    takeTour();
                });
        })
    }
}
