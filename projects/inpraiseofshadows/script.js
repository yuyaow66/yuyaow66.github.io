document.addEventListener("DOMContentLoaded", function() {
  var fallingCharacters = document.querySelectorAll('.falling-text');
  var buttonContainer = document.getElementById('button-container');

 
  fallingCharacters.forEach(function(character, index) {
    setTimeout(function() {
      character.style.animation = 'fall 5s ease-in-out forwards'; 
    }, index * 1000); 
  });

  
  setTimeout(function() {
    if (buttonContainer) buttonContainer.style.opacity = '1';
  }, 5000); 
});
