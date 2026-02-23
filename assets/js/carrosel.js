const busImages = [
  'assets/img/w/w1.png',
  'assets/img/w/w2.png',
  'assets/img/w/w3.png',
  'assets/img/w/w4.png',
  'assets/img/w/w5.png'
];

let currentIndex = 0;
const busImg = document.getElementById('bus-img');

// Only start carousel if bus-img element exists
if (busImg) {
  setInterval(() => {
    currentIndex = (currentIndex + 1) % busImages.length;
    busImg.src = busImages[currentIndex];
  }, 1000);
}
