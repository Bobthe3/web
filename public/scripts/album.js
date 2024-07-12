let thumbnail = document.querySelectorAll(".thumbnail");
let mainImage = document.getElementById("main-image")

for (let i = 0; i < thumbnail.length; i++) {
    thumbnail[i].addEventListener('click',function(){mainImage.src = this.src;} 
    )
}