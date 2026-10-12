document.addEventListener('DOMContentLoaded', function() {
    var title = "Souls in Repetition";
    var titleElement = document.getElementById('title');
    if (!titleElement) return;
    var index = 0;
    var typingInterval = setInterval(function() {
        if (index < title.length) {
            titleElement.textContent += title[index];
            index++;
        } else {
            clearInterval(typingInterval);
        }
    }, 100); 
});

document.addEventListener("DOMContentLoaded", function() {
  var images = document.querySelectorAll(".picture-slide img");
  var index = 0;

  function nextImage() {
    if (!images.length) return;
    images[index].classList.remove("active");
    index = (index + 1) % images.length;
    images[index].classList.add("active");
  }

  setInterval(nextImage, 3000); 
});

let slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("mySlides");
  let dots = document.getElementsByClassName("dot");
  if (!slides.length) return;
  if (n > slides.length) {slideIndex = 1}    
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";  
  if (dots[slideIndex-1]) dots[slideIndex-1].className += " active";
}
function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}


document.addEventListener("DOMContentLoaded", function() {

  var slideshow = document.querySelector('.slideshow-container');
  if (!slideshow) return;

  
  window.addEventListener('scroll', function() {
    if (window.scrollY > window.innerHeight) {
      slideshow.style.display = 'block';
    } else {
      slideshow.style.display = 'none';
    }
  });
});

